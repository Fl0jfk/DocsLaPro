import "server-only";

import { getMistralApiKey } from "@/app/lib/tenant-config";
import { ocrS3Key, extractDevisMetadataWithMistral } from "@/app/lib/travel-devis-ocr";
import { getTenantBucketName } from "@/app/lib/tenant-config";
import { resolveTravelsS3ObjectKey } from "@/app/lib/travels-s3";
import type { TravelsTrip } from "@/app/lib/travels-types";
import {
  comptaDocumentsFingerprint,
  comptaSheetFromTrip,
  applyBusQuoteAmountFallback,
  computeComptaSheetDerived,
  depensesFromDocumentSync,
  listComptaDocumentRefs,
  parseEuroAmount,
  resolveComptaDepenses,
  resolveBusQuoteAmountFromTrip,
  resolveSignedBusQuoteAmount,
  type TravelsComptaDocumentScan,
  type TravelsComptaExpenseLine,
  type TravelsComptaIndividualAid,
  type TravelsComptaSheet,
} from "@/app/lib/travels-compta-sheet";

type QuoteOcrChunk = {
  label: string;
  role: "devis_signe" | "devis_activite" | "piece_jointe";
  ocrText: string;
  providerName?: string | null;
  extractedPrice?: string | null;
  fileUrl?: string | null;
};

async function ocrPdfUrl(fileUrl: string, s3Key?: string | null): Promise<string> {
  const key = await resolveTravelsS3ObjectKey(fileUrl, s3Key);
  if (!key) return "";
  const bucket = await getTenantBucketName();
  if (!bucket) return "";
  try {
    return await ocrS3Key(bucket, key);
  } catch {
    return "";
  }
}

export async function collectQuoteOcrForTrip(trip: TravelsTrip): Promise<QuoteOcrChunk[]> {
  const refs = listComptaDocumentRefs(trip).filter(
    (r) => r.role !== "budget_previsionnel" && r.fileUrl,
  );
  const chunks: QuoteOcrChunk[] = [];
  for (const ref of refs) {
    const text = await ocrPdfUrl(ref.fileUrl, ref.s3Key);
    chunks.push({
      label: ref.label,
      role: ref.role === "devis_signe" ? "devis_signe" : ref.role === "devis_activite" ? "devis_activite" : "piece_jointe",
      ocrText: text,
      providerName: ref.role === "devis_signe"
        ? String((trip.data?.selectedBusQuote as Record<string, unknown> | undefined)?.providerName || "") || null
        : null,
      extractedPrice: ref.fallbackAmount != null ? String(ref.fallbackAmount) : null,
      fileUrl: ref.fileUrl,
    });
  }
  return chunks;
}

async function extractDocumentAmount(
  ocrText: string,
  label: string,
  role: string,
): Promise<number | null> {
  if (!ocrText.trim()) return null;
  if (role === "devis_signe") {
    const meta = await extractDevisMetadataWithMistral(ocrText);
    return parseEuroAmount(meta.price);
  }
  return extractQuoteAmountWithMistral(ocrText, label, role);
}

async function ocrBusQuoteAmount(trip: TravelsTrip, ref: {
  fileUrl: string;
  s3Key?: string | null;
  label: string;
  fallbackAmount?: number | null;
}): Promise<number | null> {
  let amount = ref.fallbackAmount ?? resolveBusQuoteAmountFromTrip(trip) ?? null;

  const ocrSigned = await ocrPdfUrl(ref.fileUrl, ref.s3Key);
  if (ocrSigned) {
    const extracted = await extractDocumentAmount(ocrSigned, ref.label, "devis_signe");
    if (extracted != null) return extracted;
  }

  const selected = trip.data?.selectedBusQuote as Record<string, unknown> | undefined;
  const originalUrl = String(selected?.fileUrl || "");
  if (originalUrl && originalUrl !== ref.fileUrl) {
    const ocrOriginal = await ocrPdfUrl(
      originalUrl,
      selected?.s3KeyIncoming ? String(selected.s3KeyIncoming) : null,
    );
    if (ocrOriginal) {
      const extracted = await extractDocumentAmount(ocrOriginal, ref.label, "devis_signe");
      if (extracted != null) return extracted;
    }
  }

  return amount;
}

async function extractQuoteAmountWithMistral(
  ocrText: string,
  label: string,
  role: string,
): Promise<number | null> {
  const mistralKey = await getMistralApiKey();
  if (!ocrText.trim() || !mistralKey) return null;
  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Tu extrais le montant TTC principal d'un devis scolaire (transport, entrée, activité…). " +
              "Réponds UNIQUEMENT en JSON: { montant_ttc: number|null }. " +
              "montant_ttc = nombre en euros sans symbole. null si introuvable.",
          },
          {
            role: "user",
            content: `Document: ${label} (${role})\n\nOCR:\n${ocrText.slice(0, 4000)}`,
          },
        ],
      }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) return null;
    const raw =
      (data.choices as { message?: { content?: string } }[] | undefined)?.[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(raw) as { montant_ttc?: unknown };
    return parseEuroAmount(parsed.montant_ttc);
  } catch {
    return null;
  }
}

export type ComptaSyncResult = {
  sheet: TravelsComptaSheet;
  ocrNewCount: number;
  removedCount: number;
  synced: boolean;
  notes: string;
};

/** Sync auto : structure des dépenses + OCR uniquement sur les documents nouveaux ou modifiés. */
export async function syncComptaSheetWithDocuments(
  trip: TravelsTrip,
  existing: TravelsComptaSheet | null,
): Promise<ComptaSyncResult> {
  const base = comptaSheetFromTrip(trip, existing);
  const refs = listComptaDocumentRefs(trip);
  const scannableRefs = refs.filter((r) => r.role !== "budget_previsionnel" && r.fileUrl);
  const isFirstSync = !existing?.analyzedAt;

  const prevScans = existing?.documentScans || [];
  const refKeySet = new Set(refs.map((r) => r.key));
  const keptScans = prevScans.filter((s) => refKeySet.has(s.key));
  const removedCount = prevScans.length - keptScans.length;
  const scansByKey = new Map(keptScans.map((s) => [s.key, s]));

  const toScan = isFirstSync
    ? scannableRefs
    : scannableRefs.filter((ref) => {
        const prev = scansByKey.get(ref.key);
        if (!prev) return true;
        if (prev.label !== ref.label) return true;
        if (ref.role === "devis_signe" && prev.fileUrl !== ref.fileUrl) return true;
        if (prev.amount == null && (ref.fallbackAmount == null || ref.role === "devis_signe")) {
          return true;
        }
        return false;
      });

  let ocrNewCount = 0;
  const newScans: TravelsComptaDocumentScan[] = [...keptScans];
  const freshOcrChunks: QuoteOcrChunk[] = [];

  for (const ref of toScan) {
    ocrNewCount++;
    let amount = ref.fallbackAmount ?? null;
    let ocrText = "";

    if (ref.role === "devis_signe") {
      amount = await ocrBusQuoteAmount(trip, ref);
      ocrText = await ocrPdfUrl(ref.fileUrl, ref.s3Key);
      if (!ocrText) {
        const selected = trip.data?.selectedBusQuote as Record<string, unknown> | undefined;
        const originalUrl = String(selected?.fileUrl || "");
        if (originalUrl && originalUrl !== ref.fileUrl) {
          ocrText = await ocrPdfUrl(
            originalUrl,
            selected?.s3KeyIncoming ? String(selected.s3KeyIncoming) : null,
          );
        }
      }
    } else {
      ocrText = await ocrPdfUrl(ref.fileUrl, ref.s3Key);
      if (ocrText) {
        const extracted = await extractDocumentAmount(ocrText, ref.label, ref.role);
        if (extracted != null) amount = extracted;
      }
    }

    if (ocrText) {
      freshOcrChunks.push({
        label: ref.label,
        role:
          ref.role === "devis_signe"
            ? "devis_signe"
            : ref.role === "devis_activite"
              ? "devis_activite"
              : "piece_jointe",
        ocrText,
        providerName:
          ref.role === "devis_signe"
            ? String(
                (trip.data?.selectedBusQuote as Record<string, unknown> | undefined)?.providerName || "",
              ) || null
            : null,
        extractedPrice: amount != null ? String(amount) : ref.fallbackAmount != null ? String(ref.fallbackAmount) : null,
        fileUrl: ref.fileUrl,
      });
    }
    const scan: TravelsComptaDocumentScan = {
      key: ref.key,
      fileUrl: ref.fileUrl,
      label: ref.label,
      role: ref.role,
      amount:
        ref.role === "devis_signe" && amount == null
          ? resolveBusQuoteAmountFromTrip(trip)
          : amount,
      scannedAt: new Date().toISOString(),
    };
    const idx = newScans.findIndex((s) => s.key === ref.key);
    if (idx >= 0) newScans[idx] = scan;
    else newScans.push(scan);
  }

  const budgetRef = refs.find((r) => r.role === "budget_previsionnel");
  if (budgetRef) {
    const scan: TravelsComptaDocumentScan = {
      key: "budget_previsionnel",
      fileUrl: "",
      label: budgetRef.label,
      role: "budget_previsionnel",
      amount: budgetRef.fallbackAmount ?? null,
      scannedAt: new Date().toISOString(),
    };
    const idx = newScans.findIndex((s) => s.key === "budget_previsionnel");
    if (idx >= 0) {
      newScans[idx] = { ...newScans[idx], label: scan.label, amount: newScans[idx].amount ?? scan.amount };
    } else {
      newScans.push(scan);
    }
  } else {
    const bi = newScans.findIndex((s) => s.key === "budget_previsionnel");
    if (bi >= 0) newScans.splice(bi, 1);
  }

  const fingerprint = comptaDocumentsFingerprint(trip);
  const tripBusAmount = resolveBusQuoteAmountFromTrip(trip);
  if (tripBusAmount != null) {
    const busIdx = newScans.findIndex((s) => s.key === "devis_signe");
    if (busIdx >= 0 && newScans[busIdx].amount == null) {
      newScans[busIdx] = { ...newScans[busIdx], amount: tripBusAmount };
    }
  }

  let sheet: TravelsComptaSheet;

  if (isFirstSync) {
    const ocrChunks =
      freshOcrChunks.length > 0 ? freshOcrChunks : await collectQuoteOcrForTrip(trip);
    sheet = await extractComptaSheetWithAi(trip, ocrChunks, base);
    sheet = computeComptaSheetDerived({
      ...sheet,
      depenses: applyBusQuoteAmountFallback(
        trip,
        depensesFromDocumentSync(trip, newScans, sheet.depenses),
        sheet,
      ),
      documentScans: newScans,
      syncedDocumentsFingerprint: fingerprint,
      syncedAt: new Date().toISOString(),
    });
  } else {
    sheet = computeComptaSheetDerived({
      ...base,
      depenses: applyBusQuoteAmountFallback(
        trip,
        depensesFromDocumentSync(trip, newScans, existing?.depenses),
        { ...base, facturation: base.facturation },
      ),
      documentScans: newScans,
      syncedDocumentsFingerprint: fingerprint,
      syncedAt: new Date().toISOString(),
    });
  }

  const notes: string[] = [];
  if (ocrNewCount > 0) notes.push(`${ocrNewCount} document(s) lu(s)`);
  if (removedCount > 0) notes.push(`${removedCount} document(s) retiré(s)`);
  if (!notes.length) notes.push("Dossier à jour");

  return {
    sheet,
    ocrNewCount,
    removedCount,
    synced: true,
    notes: notes.join(" · "),
  };
}

export async function extractComptaSheetWithAi(
  trip: TravelsTrip,
  ocrChunks: QuoteOcrChunk[],
  baseSheet: TravelsComptaSheet,
): Promise<TravelsComptaSheet> {
  const mistralKey = await getMistralApiKey();
  if (!mistralKey) {
    return {
      ...computeComptaSheetDerived(baseSheet),
      analysisNotes: "Clé Mistral absente — préremplissage depuis le dossier uniquement.",
    };
  }

  const ocrBlock = ocrChunks
    .map(
      (c) =>
        `### ${c.label} (${c.role})\nFournisseur: ${c.providerName || "?"}\nPrix déjà extrait: ${c.extractedPrice || "?"}\nOCR:\n${c.ocrText.slice(0, 2500)}`,
    )
    .join("\n\n");

  const tripContext = {
    titre: trip.data?.title,
    destination: trip.data?.destination,
    etablissement: trip.data?.etablissement,
    classes: trip.data?.classes,
    nb_eleves: trip.data?.nbEleves,
    nb_accompagnateurs: trip.data?.nbAccompagnateurs,
    noms_accompagnateurs: trip.data?.nomsAccompagnateurs,
    budget_previsionnel: trip.data?.coutTotal,
    createur: trip.ownerName,
  };

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Tu aides la comptabilité d'un établissement scolaire à remplir une fiche budget voyage. " +
              "À partir du dossier et des OCR fournis, extrais les montants TTC en euros (nombres, pas de symbole €). " +
              "RÈGLES DÉPENSES IMPORTANTES : " +
              "(1) UNE SEULE ligne transport/bus/autocar : uniquement à partir du devis bus SIGNÉ (rôle devis_signe). " +
              "(2) NE PAS inclure les autres devis transport reçus par mail (devis concurrents non signés). " +
              "(3) Les autres lignes de dépenses viennent des pièces jointes (rôle piece_jointe) et des devis activités (rôle devis_activite) : entrées musée, activités, restauration hors bus, etc. " +
              "Réponds UNIQUEMENT en JSON avec les clés: " +
              "compte (string|null), ligne (string|null), classe (string|null), profs (string|null), accompagnateurs (string|null), " +
              "depenses (array de {label, montant, source}), nb_eleves (number|null), prix_par_eleve (number|null), " +
              "apel_aides_collectives (number|null), autres_subventions (number|null), " +
              "aides_individuelles (array de {nom, montant}), " +
              "facturation ({prix_facture, date_facturation YYYY-MM-DD ou '', montant}), " +
              "notes (string court). " +
              "Si une info manque, mets null ou chaîne vide. Ne invente pas de subventions APEL.",
          },
          {
            role: "user",
            content: `Dossier voyage:\n${JSON.stringify(tripContext, null, 2)}\n\nDevis OCR:\n${ocrBlock || "(aucun devis OCR — utiliser le budget prévisionnel)"}`,
          },
        ],
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ...computeComptaSheetDerived(baseSheet),
        analysisNotes: "Analyse IA indisponible — vérifiez les champs manuellement.",
      };
    }

    const raw =
      (data.choices as { message?: { content?: string } }[] | undefined)?.[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const depensesRaw = Array.isArray(parsed.depenses) ? parsed.depenses : [];
    const depensesMapped: TravelsComptaExpenseLine[] = depensesRaw.map((d) => {
      const row = d as Record<string, unknown>;
      return {
        label: String(row.label || "").trim(),
        amount: parseEuroAmount(row.montant ?? row.amount),
        source: row.source ? String(row.source) : null,
      };
    });
    const depenses = resolveComptaDepenses(trip, depensesMapped);

    const individuellesRaw = Array.isArray(parsed.aides_individuelles) ? parsed.aides_individuelles : [];
    const aidesIndividuelles: TravelsComptaIndividualAid[] = individuellesRaw.map((a) => {
      const row = a as Record<string, unknown>;
      return {
        name: String(row.nom || row.name || "").trim(),
        amount: parseEuroAmount(row.montant ?? row.amount),
      };
    });
    while (aidesIndividuelles.length < 4) aidesIndividuelles.push({ name: "", amount: null });

    const fact = (parsed.facturation || {}) as Record<string, unknown>;

    const sheet: TravelsComptaSheet = {
      ...baseSheet,
      compte: String(parsed.compte ?? baseSheet.compte ?? "").trim(),
      ligne: String(parsed.ligne ?? baseSheet.ligne ?? "").trim(),
      classe: String(parsed.classe ?? baseSheet.classe ?? "").trim(),
      profs: String(parsed.profs ?? baseSheet.profs ?? "").trim(),
      accompagnateurs: String(parsed.accompagnateurs ?? baseSheet.accompagnateurs ?? "").trim(),
      depenses,
      nbEleves: parseEuroAmount(parsed.nb_eleves) ?? baseSheet.nbEleves,
      prixParEleve: parseEuroAmount(parsed.prix_par_eleve) ?? baseSheet.prixParEleve,
      apelAidesCollectives: parseEuroAmount(parsed.apel_aides_collectives) ?? baseSheet.apelAidesCollectives,
      autresSubventions: parseEuroAmount(parsed.autres_subventions) ?? baseSheet.autresSubventions,
      aidesIndividuelles,
      facturation: {
        prixFacture: parseEuroAmount(fact.prix_facture) ?? baseSheet.facturation.prixFacture,
        dateFacturation: String(fact.date_facturation ?? baseSheet.facturation.dateFacturation ?? "").trim(),
        montant: parseEuroAmount(fact.montant) ?? baseSheet.facturation.montant,
      },
      analyzedAt: new Date().toISOString(),
      analysisNotes: parsed.notes ? String(parsed.notes).slice(0, 500) : null,
    };

    return computeComptaSheetDerived(sheet);
  } catch {
    return {
      ...computeComptaSheetDerived(baseSheet),
      analysisNotes: "Erreur lors de l'analyse IA — champs préremplis depuis le dossier.",
    };
  }
}

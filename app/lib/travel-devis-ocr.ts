import { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } from "@aws-sdk/client-textract";

function textractClient() {
  return new TextractClient({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
}

export async function ocrS3Key(bucket: string, key: string): Promise<string> {
  const client = textractClient();
  const start = await client.send(
    new StartDocumentTextDetectionCommand({ DocumentLocation: { S3Object: { Bucket: bucket, Name: key } } })
  );
  const jobId = start.JobId;
  if (!jobId) return "";
  let textractFailed = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await client.send(new GetDocumentTextDetectionCommand({ JobId: jobId }));
    if (res.JobStatus === "SUCCEEDED") {
      return res.Blocks?.filter((b) => b.BlockType === "LINE").map((b) => b.Text).join(" ") || "";
    }
    if (res.JobStatus === "FAILED") {
      textractFailed = true;
      break;
    }
  }
  if (textractFailed) {
    console.error("[travel-devis-ocr] Textract FAILED", { key, jobId });
  }
  return "";
}

export type DevisOcrMetadata = {
  price: string | null;
  company: string | null;
  /** E-mail commercial / réservation lu sur le devis (OCR), pour l’envoi de commande */
  contactEmail: string | null;
};

function normalizeContactEmail(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "null") return null;
  const m = s.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : null;
}

export type TripCandidateForMatch = {
  id: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  classes?: string;
};

export type DevisOcrAndTripMatch = DevisOcrMetadata & {
  matchedTripId: string | null;
  matchConfidence: "high" | "medium" | "low" | null;
  matchMotif: string | null;
  /** Id proposé par le modèle mais absent de la liste (erreur de modèle) */
  suggestedTripId: string | null;
  /** true si le devis est rattaché mais Mistral n'est pas "high" → à contrôler dans l’UI */
  matchReviewRequired: boolean;
};

export async function extractDevisMetadataWithMistral(ocrText: string): Promise<DevisOcrMetadata> {
  if (!ocrText || !process.env.MISTRAL_API_KEY) {
    return { price: null, company: null, contactEmail: null };
  }
  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content:
              "Tu analyses le texte OCR d'un devis de transport. Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, clés: montant_ttc (string ou null, ex: \"1 250,00 €\"), societe_emetrice (string ou null, nom de l'entreprise de transport qui émet le devis), email_contact (string ou null, une seule adresse e-mail professionnelle du service commercial / réservation visible sur le document, pas une URL). Si une info est absente ou incertaine, mets null.",
          },
          { role: "user", content: `Texte:\n${ocrText.slice(0, 4000)}` },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return { price: null, company: null, contactEmail: null };
    }
    const raw = (data.choices as { message?: { content?: string } }[] | undefined)?.[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(raw) as {
      montant_ttc?: string | null;
      societe_emetrice?: string | null;
      email_contact?: string | null;
    };
    const price = parsed.montant_ttc && String(parsed.montant_ttc).toLowerCase() !== "null" ? String(parsed.montant_ttc).trim() : null;
    const company = parsed.societe_emetrice && String(parsed.societe_emetrice).toLowerCase() !== "null" ? String(parsed.societe_emetrice).trim() : null;
    const contactEmail = normalizeContactEmail(parsed.email_contact);
    return { price: price || null, company: company || null, contactEmail };
  } catch {
    return { price: null, company: null, contactEmail: null };
  }
}

function tripsJsonForMatch(candidates: TripCandidateForMatch[]): string {
  return JSON.stringify(
    candidates.map((c) => ({
      id: c.id,
      titre: c.title,
      destination: c.destination,
      dates: [c.startDate, c.endDate].filter(Boolean).join(" → "),
      statut: c.status || "",
      classes: c.classes || "",
    }))
  );
}

async function callMistralDevisTripMatch(
  ocrSlice: string,
  subj: string,
  snip: string,
  tripsJson: string
): Promise<{ ok: boolean; status: number; data: Record<string, unknown>; raw: string }> {
  if (!process.env.MISTRAL_API_KEY) {
    return { ok: false, status: 0, data: { _reason: "missing_mistral_key" }, raw: "" };
  }
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant pour une école. On te donne le texte OCR d'un devis de transport, l'objet et un extrait d'email, et une liste JSON de voyages scolaires (id, titre, destination, dates, statut, classes). " +
            "Tu dois: (1) extraire montant_ttc et societe_emetrice du devis; (2) choisir UN SEUL id de voyage qui correspond au devis (destination, intitulé, dates, classes dans l'OCR ou l'email). " +
            "Si vraiment aucun voyage ne ressemble au devis, mets trip_id à null. " +
            "confidence: \"high\" = très sûr; \"medium\" = plausible, humain devra vérifier; \"low\" = hypothèse fragile mais tu peux quand même mettre le trip_id le plus plausible si un voyage domine légèrement — sinon null. " +
            "Réponds UNIQUEMENT avec un objet JSON: montant_ttc (string|null), societe_emetrice (string|null), email_contact (string|null, e-mail professionnel commercial/réservation visible sur le devis OCR, une seule adresse), trip_id (string|null, exactement un id de la liste ou null), confidence (\"high\"|\"medium\"|\"low\"), motif (string court en français).",
        },
        {
          role: "user",
          content: `Objet e-mail: ${subj}\nExtrait: ${snip}\n\nTexte OCR du devis:\n${ocrSlice}\n\nVoyages possibles (JSON):\n${tripsJson}`,
        },
      ],
      temperature: 0.15,
      response_format: { type: "json_object" },
    }),
  });
  const data = (await res.json()) as Record<string, unknown>;
  const choices = data.choices as { message?: { content?: string } }[] | undefined;
  const raw = choices?.[0]?.message?.content?.trim() || "";
  return { ok: res.ok, status: res.status, data, raw };
}

async function interpretMistralDevisMatchResponse(
  raw: string,
  candidates: TripCandidateForMatch[],
  ocrText: string
): Promise<DevisOcrAndTripMatch> {
  if (!raw) {
    const meta = await extractDevisMetadataWithMistral(ocrText);
    return {
      ...meta,
      matchedTripId: null,
      matchConfidence: null,
      matchMotif: "reponse_mistral_vide",
      suggestedTripId: null,
      matchReviewRequired: false,
    };
  }
  let parsed: {
    montant_ttc?: string | null;
    societe_emetrice?: string | null;
    email_contact?: string | null;
    trip_id?: string | null;
    confidence?: string;
    motif?: string | null;
  };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    const meta = await extractDevisMetadataWithMistral(ocrText);
    return {
      ...meta,
      matchedTripId: null,
      matchConfidence: null,
      matchMotif: "erreur_mistral_match",
      suggestedTripId: null,
      matchReviewRequired: false,
    };
  }

  const price =
    parsed.montant_ttc && String(parsed.montant_ttc).toLowerCase() !== "null"
      ? String(parsed.montant_ttc).trim()
      : null;
  const company =
    parsed.societe_emetrice && String(parsed.societe_emetrice).toLowerCase() !== "null"
      ? String(parsed.societe_emetrice).trim()
      : null;
  const contactEmail = normalizeContactEmail(parsed.email_contact);

  const allowedIds = new Set(candidates.map((c) => String(c.id)));
  const confRaw = String(parsed.confidence || "").toLowerCase();
  const tripRaw = parsed.trip_id != null ? String(parsed.trip_id).trim() : "";
  const tripOk = Boolean(tripRaw && allowedIds.has(tripRaw));
  const matchConfidence: "high" | "medium" | "low" | null =
    confRaw === "high" || confRaw === "medium" || confRaw === "low" ? confRaw : null;

  const matchedTripId: string | null = tripOk ? tripRaw : null;
  const matchReviewRequired = tripOk && matchConfidence !== "high";
  const suggestedTripId: string | null = !tripOk && tripRaw ? tripRaw : null;

  return {
    price: price || null,
    company: company || null,
    contactEmail,
    matchedTripId,
    matchConfidence,
    matchMotif: parsed.motif ? String(parsed.motif).slice(0, 500) : null,
    suggestedTripId,
    matchReviewRequired,
  };
}

/**
 * Déduit prix + société + voyage (OCR + mail). Si trip_id est dans la liste, il est retenu même en confidence low ;
 * matchReviewRequired est false seulement pour confidence "high".
 */
export async function extractDevisAndMatchTripWithMistral(
  ocrText: string,
  emailContext: { subject: string; snippet: string },
  candidates: TripCandidateForMatch[]
): Promise<DevisOcrAndTripMatch> {
  const empty: DevisOcrAndTripMatch = {
    price: null,
    company: null,
    contactEmail: null,
    matchedTripId: null,
    matchConfidence: null,
    matchMotif: null,
    suggestedTripId: null,
    matchReviewRequired: false,
  };
  if (!process.env.MISTRAL_API_KEY) {
    return empty;
  }

  const ocrSlice = (ocrText || "").slice(0, 3500);
  const subj = (emailContext.subject || "").slice(0, 500);
  const snip = (emailContext.snippet || "").slice(0, 500);

  if (!candidates.length) {
    const meta = await extractDevisMetadataWithMistral(ocrText);
    return { ...empty, ...meta, matchMotif: "aucun_voyage_en_liste" };
  }

  const tripsJson = tripsJsonForMatch(candidates);

  try {
    const { ok, raw } = await callMistralDevisTripMatch(ocrSlice, subj, snip, tripsJson);
    if (!ok) {
      const meta = await extractDevisMetadataWithMistral(ocrText);
      return {
        ...meta,
        matchedTripId: null,
        matchConfidence: null,
        matchMotif: "erreur_http_mistral",
        suggestedTripId: null,
        matchReviewRequired: false,
      };
    }
    if (!raw) {
      const meta = await extractDevisMetadataWithMistral(ocrText);
      return {
        ...meta,
        matchedTripId: null,
        matchConfidence: null,
        matchMotif: "reponse_mistral_vide",
        suggestedTripId: null,
        matchReviewRequired: false,
      };
    }
    return await interpretMistralDevisMatchResponse(raw, candidates, ocrText);
  } catch {
    const meta = await extractDevisMetadataWithMistral(ocrText);
    return {
      ...meta,
      matchedTripId: null,
      matchConfidence: null,
      matchMotif: "erreur_mistral_match",
      suggestedTripId: null,
      matchReviewRequired: false,
    };
  }
}

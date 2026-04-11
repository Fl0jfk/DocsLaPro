import { TextractClient,StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand} from "@aws-sdk/client-textract";

function debugTravelIngest(msg: string, data?: Record<string, unknown>) {
  const on =
    process.env.DEBUG_TRAVEL_EMAIL_INGEST === "1" ||
    process.env.DEBUG_TRAVEL_EMAIL_INGEST === "true";
  if (!on) return;
  if (data !== undefined) console.log(`[travel-devis-ocr] ${msg}`, data);
  else console.log(`[travel-devis-ocr] ${msg}`);
}

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
    new StartDocumentTextDetectionCommand({ DocumentLocation: { S3Object: { Bucket: bucket, Name: key } }})
  );
  const jobId = start.JobId;
  if (!jobId) {
    debugTravelIngest("Textract: pas de JobId", { bucket, key });
    return "";
  }
  let textractFailed = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await client.send(new GetDocumentTextDetectionCommand({ JobId: jobId }));
    if (res.JobStatus === "SUCCEEDED") {
      const text =
        res.Blocks?.filter((b) => b.BlockType === "LINE").map((b) => b.Text).join(" ") || "";
      debugTravelIngest("Textract OK", {
        key,
        charCount: text.length,
        preview: text.slice(0, 900),
      });
      return text;
    }
    if (res.JobStatus === "FAILED") {
      textractFailed = true;
      debugTravelIngest("Textract FAILED", {
        key,
        jobId,
        statusMessage: res.StatusMessage,
        apiResponseMetadata: res.$metadata,
      });
      break;
    }
  }
  if (!textractFailed) {
    debugTravelIngest("Textract: timeout (job toujours en cours ou vide)", { key, jobId });
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
  /** true si le devis est rattaché mais Mistral n'est pas "high" → à contrôler dans l'UI */
  matchReviewRequired: boolean;
};

export async function extractDevisMetadataWithMistral(ocrText: string): Promise<DevisOcrMetadata> {
  if (!ocrText || !process.env.MISTRAL_API_KEY) {
    debugTravelIngest("extractDevisMetadata: skip", {
      hasOcr: Boolean(ocrText?.length),
      hasKey: Boolean(process.env.MISTRAL_API_KEY),
    });
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
      debugTravelIngest("Mistral metadata HTTP erreur", {
        status: res.status,
        body: JSON.stringify(data).slice(0, 1500),
      });
      return { price: null, company: null, contactEmail: null };
    }
    const raw = (data.choices as { message?: { content?: string } }[] | undefined)?.[0]?.message?.content?.trim() || "";
    debugTravelIngest("Mistral metadata réponse brute", { raw: raw.slice(0, 800) });
    const parsed = JSON.parse(raw) as {
      montant_ttc?: string | null;
      societe_emetrice?: string | null;
      email_contact?: string | null;
    };
    const price = parsed.montant_ttc && String(parsed.montant_ttc).toLowerCase() !== "null" ? String(parsed.montant_ttc).trim() : null;
    const company = parsed.societe_emetrice && String(parsed.societe_emetrice).toLowerCase() !== "null" ? String(parsed.societe_emetrice).trim() : null;
    const contactEmail = normalizeContactEmail(parsed.email_contact);
    return { price: price || null, company: company || null, contactEmail };
  } catch (e) {
    debugTravelIngest("Mistral metadata exception", { error: String(e) });
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

  debugTravelIngest("match: interprétation", {
    trip_id_brut: tripRaw || null,
    trip_dans_liste: tripOk,
    confidence_brute: parsed.confidence ?? null,
    matchConfidence,
    motif: parsed.motif ?? null,
    suggestedTripId,
    prix: price,
    societe: company,
    email_contact: contactEmail,
  });
  if (!tripOk && tripRaw) {
    debugTravelIngest("match: trip_id refusé (pas dans la liste des candidats)", {
      proposé: tripRaw,
      ids_autorisés: [...allowedIds],
    });
  }
  if (!tripRaw) {
    debugTravelIngest("match: Mistral a renvoyé trip_id null ou vide");
  }

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

export type DevisIngestDiagnostic = {
  humanSummary: string;
  blockages: string[];
  ocrCharCount: number;
  ocrText: string;
  mistralKeyPresent: boolean;
  candidatesCount: number;
  candidates: TripCandidateForMatch[];
  userPromptSentToMistral: string;
  mistralHttpStatus: number;
  mistralHttpOk: boolean;
  mistralResponseKeys: string[];
  mistralRawAssistantMessage: string;
  mistralApiBodySnippet: string;
  jsonParseError: string | null;
  parsedFromModel: Record<string, unknown> | null;
  tripIdRaw: string | null;
  tripIdInCandidateList: boolean;
  allowedTripIds: string[];
  finalMatch: DevisOcrAndTripMatch;
};

const OCR_CAP_RESPONSE = 120_000;

/**
 * Même pipeline que l’ingest e-mail, mais renvoie tout ce qui est lisible pour déboguer (UI admin).
 */
export async function diagnoseDevisIngestMatch(
  ocrText: string,
  emailContext: { subject: string; snippet: string },
  candidates: TripCandidateForMatch[]
): Promise<DevisIngestDiagnostic> {
  const emptyMatch: DevisOcrAndTripMatch = {
    price: null,
    company: null,
    contactEmail: null,
    matchedTripId: null,
    matchConfidence: null,
    matchMotif: null,
    suggestedTripId: null,
    matchReviewRequired: false,
  };

  const blockages: string[] = [];
  const ocr = ocrText || "";
  const mistralKeyPresent = Boolean(process.env.MISTRAL_API_KEY);
  if (!mistralKeyPresent) blockages.push("Variable MISTRAL_API_KEY absente : le serveur ne peut pas appeler Mistral.");

  if (ocr.length === 0) {
    blockages.push("Texte OCR vide : Textract n’a rien renvoyé, ou le PDF n’est pas lisible / mauvaise clé S3.");
  }

  const ocrSlice = ocr.slice(0, 3500);
  const subj = (emailContext.subject || "").slice(0, 500);
  const snip = (emailContext.snippet || "").slice(0, 500);
  const tripsJson = candidates.length ? tripsJsonForMatch(candidates) : "[]";
  const userPromptSentToMistral = `Objet e-mail: ${subj}\nExtrait: ${snip}\n\nTexte OCR du devis:\n${ocrSlice}\n\nVoyages possibles (JSON):\n${tripsJson}`;

  if (candidates.length === 0) {
    blockages.push(
      "Aucun voyage candidat : travels/index.json vide, illisible, ou aucun voyage avec needsBus / transportRequest (et liste globale vide)."
    );
    const meta = await extractDevisMetadataWithMistral(ocr);
    const finalMatch = { ...emptyMatch, ...meta, matchMotif: "aucun_voyage_en_liste" };
    return {
      humanSummary: blockages.join(" "),
      blockages,
      ocrCharCount: ocr.length,
      ocrText: ocr.slice(0, OCR_CAP_RESPONSE),
      mistralKeyPresent,
      candidatesCount: 0,
      candidates: [],
      userPromptSentToMistral,
      mistralHttpStatus: 0,
      mistralHttpOk: false,
      mistralResponseKeys: [],
      mistralRawAssistantMessage: "",
      mistralApiBodySnippet: "",
      jsonParseError: null,
      parsedFromModel: null,
      tripIdRaw: null,
      tripIdInCandidateList: false,
      allowedTripIds: [],
      finalMatch,
    };
  }

  let mistralHttpStatus = 0;
  let mistralHttpOk = false;
  let mistralResponseKeys: string[] = [];
  let mistralRawAssistantMessage = "";
  let mistralApiBodySnippet = "";
  let jsonParseError: string | null = null;
  let parsedFromModel: Record<string, unknown> | null = null;
  let tripIdRaw: string | null = null;
  let tripIdInCandidateList = false;
  const allowedTripIds = candidates.map((c) => String(c.id));
  let finalMatch: DevisOcrAndTripMatch = emptyMatch;

  try {
    const { ok, status, data, raw } = await callMistralDevisTripMatch(ocrSlice, subj, snip, tripsJson);
    mistralHttpStatus = status;
    mistralHttpOk = ok;
    mistralResponseKeys = Object.keys(data);
    mistralRawAssistantMessage = raw;
    mistralApiBodySnippet = JSON.stringify(data).slice(0, 4000);

    if (!ok) {
      blockages.push(
        `Mistral a répondu HTTP ${status} (voir extrait JSON ci-dessous). Pas de match voyage dans ce cas.`
      );
      const meta = await extractDevisMetadataWithMistral(ocr);
      finalMatch = {
        ...meta,
        matchedTripId: null,
        matchConfidence: null,
        matchMotif: "erreur_http_mistral",
        suggestedTripId: null,
        matchReviewRequired: false,
      };
    } else if (!raw) {
      blockages.push(
        "Réponse Mistral sans choices[0].message.content : quota, modèle, ou erreur API (voir extrait)."
      );
      if (data.error) blockages.push(`Détail API : ${JSON.stringify(data.error).slice(0, 500)}`);
      const meta = await extractDevisMetadataWithMistral(ocr);
      finalMatch = {
        ...meta,
        matchedTripId: null,
        matchConfidence: null,
        matchMotif: "reponse_mistral_vide",
        suggestedTripId: null,
        matchReviewRequired: false,
      };
    } else {
      try {
        parsedFromModel = JSON.parse(raw) as Record<string, unknown>;
        const tr = parsedFromModel.trip_id;
        tripIdRaw = tr != null && String(tr).trim() !== "" ? String(tr).trim() : null;
        const allowed = new Set(allowedTripIds);
        tripIdInCandidateList = Boolean(tripIdRaw && allowed.has(tripIdRaw));
        if (tripIdRaw && !tripIdInCandidateList) {
          blockages.push(
            `Le modèle a proposé trip_id « ${tripIdRaw} » mais cet id n’est pas dans les ${candidates.length} voyages candidats (ids récents / filtre bus).`
          );
        }
        if (!tripIdRaw) {
          blockages.push(
            "Mistral a renvoyé trip_id vide ou null : il ne voit pas de correspondance assez claire avec la liste (voir motif dans le JSON)."
          );
        }
      } catch (e) {
        jsonParseError = String(e);
        blockages.push(`Le JSON renvoyé par Mistral n’a pas pu être parsé : ${jsonParseError}`);
      }
      finalMatch = await interpretMistralDevisMatchResponse(raw, candidates, ocr);
      if (finalMatch.matchMotif === "erreur_mistral_match") {
        blockages.push("Erreur d’interprétation après Mistral (parse ou exception).");
      }
    }
  } catch (e) {
    blockages.push(`Exception réseau ou serveur pendant l’appel Mistral : ${String(e)}`);
    const meta = await extractDevisMetadataWithMistral(ocr);
    finalMatch = {
      ...meta,
      matchedTripId: null,
      matchConfidence: null,
      matchMotif: "erreur_mistral_match",
      suggestedTripId: null,
      matchReviewRequired: false,
    };
  }

  const humanSummary = finalMatch.matchedTripId
    ? [
        `Rattaché au voyage « ${finalMatch.matchedTripId} » (confiance ${finalMatch.matchConfidence ?? "?"}).`,
        finalMatch.matchReviewRequired
          ? "Revue conseillée : la confiance n’est pas « high »."
          : "",
      ]
        .filter(Boolean)
        .join(" ")
    : blockages.length > 0
      ? blockages.join(" ")
      : "Pas de voyage matché ; voir les sections détaillées ci-dessous.";

  return {
    humanSummary,
    blockages,
    ocrCharCount: ocr.length,
    ocrText: ocr.slice(0, OCR_CAP_RESPONSE),
    mistralKeyPresent,
    candidatesCount: candidates.length,
    candidates,
    userPromptSentToMistral,
    mistralHttpStatus,
    mistralHttpOk,
    mistralResponseKeys,
    mistralRawAssistantMessage,
    mistralApiBodySnippet,
    jsonParseError,
    parsedFromModel,
    tripIdRaw,
    tripIdInCandidateList,
    allowedTripIds,
    finalMatch,
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
    debugTravelIngest("match: pas de MISTRAL_API_KEY");
    return empty;
  }

  const ocrSlice = (ocrText || "").slice(0, 3500);
  const subj = (emailContext.subject || "").slice(0, 500);
  const snip = (emailContext.snippet || "").slice(0, 500);

  debugTravelIngest("match: entrée", {
    ocrTotalChars: (ocrText || "").length,
    ocrEnvoyéAuModèle: ocrSlice.length,
    ocrPreview: ocrSlice.slice(0, 700),
    subject: subj,
    snippet: snip,
  });

  if (!candidates.length) {
    debugTravelIngest("match: aucun candidat voyage");
    const meta = await extractDevisMetadataWithMistral(ocrText);
    return { ...empty, ...meta, matchMotif: "aucun_voyage_en_liste" };
  }

  debugTravelIngest("match: candidats", {
    count: candidates.length,
    ids: candidates.map((c) => c.id),
    résumé: candidates.map((c) => ({
      id: c.id,
      titre: (c.title || "").slice(0, 80),
      destination: (c.destination || "").slice(0, 60),
    })),
  });

  const tripsJson = tripsJsonForMatch(candidates);

  try {
    const { ok, status, data, raw } = await callMistralDevisTripMatch(ocrSlice, subj, snip, tripsJson);
    if (!ok) {
      debugTravelIngest("Mistral match HTTP erreur", {
        status,
        body: JSON.stringify(data).slice(0, 2000),
      });
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
      debugTravelIngest("Mistral match: pas de choices/content", {
        keys: Object.keys(data),
        erreurApi: data.error,
      });
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
    debugTravelIngest("Mistral match réponse JSON brute", { raw: raw.slice(0, 1200) });
    return await interpretMistralDevisMatchResponse(raw, candidates, ocrText);
  } catch (e) {
    debugTravelIngest("match: exception parse ou réseau", { error: String(e) });
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

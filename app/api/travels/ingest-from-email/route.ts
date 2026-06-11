import { createHash } from "crypto";
import { NextResponse, after } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { publicS3UrlForKey } from "@/app/lib/travels-s3";
import { providerNameFromEmail } from "@/app/lib/transport-providers";
import { ocrS3Key, type TripCandidateForMatch } from "@/app/lib/travel-devis-ocr";
import {
  analyzeTravelEmailWithMistral,
  type TransportEmailMessage,
  type TravelEmailAnalysis,
} from "@/app/lib/travel-email-intelligence";

const INCOMING_PREFIX = "devis-incoming/";
const UNMATCHED_KEY = "travels/email-devis-unmatched.json";
const INDEX_KEY = "travels/index.json";
const MAX_CANDIDATES = 45;
const MARKER_PREFIX = "travels/email-ingest-markers/";
const PENDING_STALE_MS = 15 * 60 * 1000;

const INACTIVE_STATUSES = new Set(["ANNULE", "REJETE", "SEANCE_ANNULEE"]);

export const maxDuration = 300;

/** Extrait l'id pièce jointe Gmail depuis `devis-incoming/{msgId}/{attachmentId}_{file}.pdf`. */
function attachmentIdFromIncomingKey(s3Key: string): string | null {
  const m = s3Key.match(/^devis-incoming\/[^/]+\/([^_]+)_/);
  return m?.[1] ?? null;
}

function ingestMarkerKey(gmailMessageId: string, s3Key?: string): string {
  if (s3Key) {
    const attId = attachmentIdFromIncomingKey(s3Key);
    if (attId) return `${MARKER_PREFIX}${gmailMessageId}/${attId}.json`;
    const h = createHash("sha256").update(`${gmailMessageId}\0${s3Key}`, "utf8").digest("hex");
    return `${MARKER_PREFIX}${h}.json`;
  }
  return `${MARKER_PREFIX}msg/${gmailMessageId}.json`;
}

type IngestMarker = {
  pending?: boolean;
  startedAt?: string;
  completed?: boolean;
  failed?: boolean;
  duplicate?: boolean;
  matched?: boolean;
  tripId?: string | null;
  reason?: string | null;
  devisId?: string | null;
  messageId?: string | null;
  gmailMessageId?: string;
  s3Key?: string;
  updatedAt?: string;
};

function devisAlreadyInTrip(
  received: unknown[],
  gmailMessageId: string,
  s3Key: string,
  originalFilename?: string,
): boolean {
  return received.some((d) => {
    if (!d || typeof d !== "object") return false;
    const row = d as {
      gmailMessageId?: string;
      s3KeyIncoming?: string;
      originalFilename?: string | null;
      source?: string;
    };
    if (row.gmailMessageId !== gmailMessageId) return false;
    if (row.s3KeyIncoming === s3Key) return true;
    if (row.source === "email" && originalFilename && row.originalFilename === originalFilename) return true;
    return false;
  });
}

function transportEmailAlreadyInTrip(
  messages: unknown[],
  gmailMessageId: string,
  s3Key?: string,
): boolean {
  return messages.some((m) => {
    if (!m || typeof m !== "object") return false;
    const row = m as { gmailMessageId?: string; s3KeyIncoming?: string };
    if (row.gmailMessageId !== gmailMessageId) return false;
    if (s3Key) return row.s3KeyIncoming === s3Key;
    return !row.s3KeyIncoming;
  });
}

async function readIngestMarker(client: S3Client, bucket: string, key: string): Promise<IngestMarker | null> {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const raw = await res.Body?.transformToString();
    if (!raw) return null;
    return JSON.parse(raw) as IngestMarker;
  } catch {
    return null;
  }
}

async function writeIngestMarker(client: S3Client, bucket: string, key: string, data: IngestMarker) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 2),
      ContentType: "application/json",
    }),
  );
}

function isAllowedIncomingKey(key: string): boolean {
  if (!key.startsWith(INCOMING_PREFIX) || key.includes("..")) return false;
  return key.length <= 2048;
}

function s3() {
  return new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
}

type IndexTrip = {
  id: string | number;
  status?: string;
  createdAt?: string;
  data?: {
    title?: string;
    destination?: string;
    date?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    needsBus?: boolean;
    transportRequest?: unknown;
    classes?: string | string[];
  };
};

async function loadTripCandidates(client: S3Client, bucket: string): Promise<TripCandidateForMatch[]> {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: INDEX_KEY }));
    const raw = await res.Body?.transformToString();
    if (!raw) return [];
    const all = JSON.parse(raw) as IndexTrip[];
    if (!Array.isArray(all)) return [];
    const sorted = [...all].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
    const active = sorted.filter((t) => !INACTIVE_STATUSES.has(String(t.status || "")));
    const withTransport = active.filter((t) => Boolean(t.data?.needsBus || t.data?.transportRequest));
    const pool = withTransport.length > 0 ? withTransport : active;
    return pool.slice(0, MAX_CANDIDATES).map((t) => {
      const d = t.data || {};
      const classes = Array.isArray(d.classes) ? d.classes.join(", ") : String(d.classes || "");
      return {
        id: String(t.id),
        title: String(d.title || ""),
        destination: String(d.destination || ""),
        startDate: d.startDate || d.date || undefined,
        endDate: d.endDate || d.date || undefined,
        status: t.status || "",
        classes,
      };
    });
  } catch {
    return [];
  }
}

type UnmatchedItem = {
  id: string;
  s3Key?: string;
  fromEmail: string;
  subject: string;
  gmailMessageId: string;
  snippet?: string;
  originalFilename?: string;
  createdAt: string;
  extractedPrice?: string | null;
  extractedCompany?: string | null;
  guessedTripId?: string | null;
  matchMotif?: string | null;
  matchConfidence?: string | null;
  messageType?: string | null;
  reason?: string;
};

async function appendUnmatched(client: S3Client, bucket: string, item: UnmatchedItem) {
  let items: UnmatchedItem[] = [];
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: UNMATCHED_KEY }));
    const raw = await res.Body?.transformToString();
    if (raw) {
      const parsed = JSON.parse(raw) as { items?: UnmatchedItem[] };
      items = Array.isArray(parsed.items) ? parsed.items : [];
    }
  } catch {
    /* absent */
  }
  items.unshift(item);
  const capped = items.slice(0, 200);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: UNMATCHED_KEY,
      Body: JSON.stringify({ items: capped }, null, 2),
      ContentType: "application/json",
    }),
  );
}

function ingestSecretFromEnv(): string | undefined {
  const raw = process.env.TRAVEL_EMAIL_INGEST_SECRET?.trim() || process.env.INGEST_SECRET?.trim();
  return raw || undefined;
}

function buildEmailAttachmentLabel(
  analysis: TravelEmailAnalysis,
  originalFilename: string | undefined,
  providerName: string,
): string {
  const file = originalFilename || "document.pdf";
  if (analysis.messageType === "confirmation_commande") {
    const who = analysis.company || providerName;
    return who ? `Confirmation transport — ${who}` : `Confirmation transport — ${file}`;
  }
  if (analysis.messageType === "info_transport") {
    return `Info transport — ${file}`;
  }
  return `E-mail transport — ${file}`;
}

function attachmentAlreadyInTrip(attachments: unknown[], gmailMessageId: string, s3Key: string): boolean {
  return attachments.some((a) => {
    if (!a || typeof a !== "object") return false;
    const row = a as { gmailMessageId?: string; s3Key?: string };
    if (row.s3Key === s3Key) return true;
    return row.gmailMessageId === gmailMessageId && row.s3Key === s3Key;
  });
}

function appendEmailPdfToAttachments(
  tripFresh: Record<string, unknown>,
  input: {
    fileUrl: string;
    s3Key: string;
    gmailMessageId: string;
    label: string;
  },
): boolean {
  const data = (tripFresh.data && typeof tripFresh.data === "object" ? tripFresh.data : {}) as Record<
    string,
    unknown
  >;
  const attachments = Array.isArray(data.attachments) ? data.attachments : [];
  if (attachmentAlreadyInTrip(attachments, input.gmailMessageId, input.s3Key)) return false;
  data.attachments = [
    ...attachments,
    {
      name: input.label,
      url: input.fileUrl,
      s3Key: input.s3Key,
      source: "email",
      gmailMessageId: input.gmailMessageId,
    },
  ];
  tripFresh.data = data;
  return true;
}

function buildTransportEmailMessage(
  analysis: TravelEmailAnalysis,
  input: {
    gmailMessageId: string;
    fromEmail: string;
    subject: string;
    s3Key?: string;
    pdfUrl?: string;
    originalFilename?: string;
  },
  now: string,
): TransportEmailMessage {
  return {
    id: `${Date.now()}-${input.gmailMessageId.slice(-8)}`,
    gmailMessageId: input.gmailMessageId,
    fromEmail: input.fromEmail.trim(),
    subject: input.subject || "",
    messageType: analysis.messageType,
    summary: analysis.summary || input.subject || "Message transport",
    driverName: analysis.driverName,
    driverPhone: analysis.driverPhone,
    details: analysis.confirmationDetails,
    pdfUrl: input.pdfUrl ?? null,
    s3KeyIncoming: input.s3Key ?? null,
    originalFilename: input.originalFilename ?? null,
    receivedAt: now,
    matchConfidence: analysis.matchConfidence,
    matchMotif: analysis.matchMotif,
    source: "email",
  };
}

function applyTransportInfoToTripData(
  tripFresh: Record<string, unknown>,
  analysis: TravelEmailAnalysis,
  msg: TransportEmailMessage,
) {
  const data = (tripFresh.data && typeof tripFresh.data === "object" ? tripFresh.data : {}) as Record<
    string,
    unknown
  >;
  const existing = Array.isArray(data.transportEmailMessages) ? data.transportEmailMessages : [];
  data.transportEmailMessages = [msg, ...existing].slice(0, 50);

  if (analysis.messageType === "confirmation_commande") {
    data.transportProviderConfirmation = {
      receivedAt: msg.receivedAt,
      summary: msg.summary,
      fromEmail: msg.fromEmail,
      providerName: analysis.company,
      pdfUrl: msg.pdfUrl ?? null,
      s3KeyIncoming: msg.s3KeyIncoming ?? null,
      originalFilename: msg.originalFilename ?? null,
      gmailMessageId: msg.gmailMessageId,
    };
  }

  if (analysis.driverName || analysis.driverPhone || analysis.summary) {
    const tr = (data.transportRequest && typeof data.transportRequest === "object"
      ? data.transportRequest
      : {}) as Record<string, unknown>;
    const lines: string[] = [];
    if (analysis.driverName) lines.push(`Chauffeur : ${analysis.driverName}`);
    if (analysis.driverPhone) lines.push(`Tél. chauffeur : ${analysis.driverPhone}`);
    if (analysis.summary) lines.push(analysis.summary);
    const block = lines.join("\n");
    const phoneKey = analysis.driverPhone || "";
    const existingText = String(tr.freeText || "");
    if (phoneKey && !existingText.includes(phoneKey)) {
      tr.freeText = existingText
        ? `${existingText}\n\n--- Info transport (e-mail) ---\n${block}`
        : block;
      data.transportRequest = tr;
    } else if (!phoneKey && analysis.summary && !existingText.includes(analysis.summary.slice(0, 40))) {
      tr.freeText = existingText
        ? `${existingText}\n\n--- Info transport (e-mail) ---\n${block}`
        : block;
      data.transportRequest = tr;
    }
  }

  tripFresh.data = data;
  const history = Array.isArray(tripFresh.history) ? tripFresh.history : [];
  history.unshift({
    date: msg.receivedAt,
    user: "Système (e-mail)",
    action:
      analysis.messageType === "confirmation_commande"
        ? "Confirmation transport reçue"
        : "Info transport reçue par e-mail",
    note: analysis.summary || msg.subject,
  });
  tripFresh.history = history.slice(0, 200);
}

type IngestJobParams = {
  bucket: string;
  markerKey: string;
  s3Key?: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  emailBodyPlain?: string;
  gmailMessageId: string;
  originalFilename?: string;
  candidates: TripCandidateForMatch[];
  providerName: string;
  hasPdfAttachment: boolean;
};

async function runIngestBackgroundJob(p: IngestJobParams): Promise<void> {
  const client = s3();
  const {
    bucket,
    markerKey,
    s3Key,
    fromEmail,
    subject,
    snippet,
    emailBodyPlain,
    gmailMessageId,
    originalFilename,
    candidates,
    providerName,
    hasPdfAttachment,
  } = p;

  const finishMarker = async (m: IngestMarker) => {
    await writeIngestMarker(client, bucket, markerKey, { ...m, pending: false, completed: true });
  };

  try {
    let ocrText = "";
    if (s3Key) {
      try {
        ocrText = await ocrS3Key(bucket, s3Key);
      } catch (e) {
        console.error("[ingest-from-email] OCR:", e);
      }
    }

    const analysis = await analyzeTravelEmailWithMistral({
      subject: subject || "",
      snippet: snippet || "",
      bodyPlain: emailBodyPlain,
      ocrText,
      fromEmail,
      hasPdfAttachment,
      candidates,
    });

    const now = new Date().toISOString();
    const tripId = analysis.matchedTripId;

    if (!candidates.length) {
      await appendUnmatched(client, bucket, {
        id: `${Date.now()}-${gmailMessageId.slice(-8)}`,
        s3Key,
        fromEmail,
        subject: subject || "",
        gmailMessageId,
        snippet,
        originalFilename,
        createdAt: now,
        extractedPrice: analysis.price,
        extractedCompany: analysis.company,
        guessedTripId: analysis.suggestedTripId,
        matchMotif: analysis.matchMotif,
        matchConfidence: analysis.matchConfidence,
        messageType: analysis.messageType,
        reason: "aucun_voyage_liste",
      });
      await finishMarker({ matched: false, reason: "aucun_voyage_liste", tripId: null });
      return;
    }

    if (!tripId) {
      await appendUnmatched(client, bucket, {
        id: `${Date.now()}-${gmailMessageId.slice(-8)}`,
        s3Key,
        fromEmail,
        subject: subject || "",
        gmailMessageId,
        snippet,
        originalFilename,
        createdAt: now,
        extractedPrice: analysis.price,
        extractedCompany: analysis.company,
        guessedTripId: analysis.suggestedTripId,
        matchMotif: analysis.matchMotif,
        matchConfidence: analysis.matchConfidence,
        messageType: analysis.messageType,
        reason: "pas_de_correspondance_ia",
      });
      await finishMarker({ matched: false, reason: "pas_de_correspondance_ia", tripId: null });
      return;
    }

    const tripKey = `travels/${tripId}.json`;
    let tripFresh: Record<string, unknown>;
    try {
      const tripRes = await client.send(new GetObjectCommand({ Bucket: bucket, Key: tripKey }));
      const tripRaw = await tripRes.Body?.transformToString();
      tripFresh = tripRaw ? JSON.parse(tripRaw) : {};
    } catch {
      await appendUnmatched(client, bucket, {
        id: `${Date.now()}-${gmailMessageId.slice(-8)}`,
        s3Key,
        fromEmail,
        subject: subject || "",
        gmailMessageId,
        snippet,
        originalFilename,
        createdAt: now,
        extractedPrice: analysis.price,
        extractedCompany: analysis.company,
        guessedTripId: tripId,
        matchMotif: analysis.matchMotif,
        matchConfidence: analysis.matchConfidence,
        messageType: analysis.messageType,
        reason: "voyage_introuvable_s3",
      });
      await finishMarker({ matched: false, reason: "voyage_introuvable_s3", tripId });
      return;
    }

    let devisId: string | null = null;
    let messageId: string | null = null;
    let attachmentAdded = false;
    let duplicate = false;
    const fileViewUrl = s3Key ? publicS3UrlForKey(s3Key) : undefined;
    const isDevis = analysis.messageType === "devis_pdf";

    if (isDevis && hasPdfAttachment && s3Key) {
      let received = Array.isArray(tripFresh.receivedDevis) ? tripFresh.receivedDevis : [];
      if (devisAlreadyInTrip(received, gmailMessageId, s3Key, originalFilename)) {
        duplicate = true;
      } else {
        const newDevis = {
          id: Date.now().toString(),
          providerName: analysis.company || providerName,
          fileUrl: fileViewUrl,
          providerEmail: fromEmail.trim(),
          createdAt: now,
          source: "email",
          gmailMessageId,
          originalFilename: originalFilename ?? null,
          extractedPrice: analysis.price,
          extractedCompany: analysis.company,
          s3KeyIncoming: s3Key,
          matchMethod: "mistral_email_ia",
          matchConfidence: analysis.matchConfidence,
          matchMotif: analysis.matchMotif,
          matchReviewRequired: analysis.matchReviewRequired,
          extractedContactEmail: analysis.contactEmail,
        };
        devisId = newDevis.id;
        tripFresh.receivedDevis = [...received, newDevis];
      }
    }

    const data = (tripFresh.data && typeof tripFresh.data === "object" ? tripFresh.data : {}) as Record<
      string,
      unknown
    >;
    const transportMsgs = Array.isArray(data.transportEmailMessages) ? data.transportEmailMessages : [];
    const transportDuplicate = transportEmailAlreadyInTrip(transportMsgs, gmailMessageId, s3Key);

    const shouldStoreTransportMsg =
      !transportDuplicate &&
      (analysis.messageType === "info_transport" ||
        analysis.messageType === "confirmation_commande" ||
        analysis.messageType === "reponse_generique" ||
        (hasPdfAttachment && !isDevis && analysis.messageType !== "non_lie"));

    if (shouldStoreTransportMsg) {
      const msg = buildTransportEmailMessage(
        analysis,
        {
          gmailMessageId,
          fromEmail,
          subject,
          s3Key,
          pdfUrl: fileViewUrl,
          originalFilename,
        },
        now,
      );
      messageId = msg.id;
      applyTransportInfoToTripData(tripFresh, analysis, msg);
    }

    if (hasPdfAttachment && s3Key && fileViewUrl && !isDevis && analysis.messageType !== "non_lie") {
      attachmentAdded = appendEmailPdfToAttachments(tripFresh, {
        fileUrl: fileViewUrl,
        s3Key,
        gmailMessageId,
        label: buildEmailAttachmentLabel(analysis, originalFilename, providerName),
      });
      if (attachmentAdded) {
        const history = Array.isArray(tripFresh.history) ? tripFresh.history : [];
        history.unshift({
          date: now,
          user: "Système (e-mail)",
          action: "Document ajouté au dossier",
          note: buildEmailAttachmentLabel(analysis, originalFilename, providerName),
        });
        tripFresh.history = history.slice(0, 200);
      }
    }

    if (devisId || messageId || attachmentAdded) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: tripKey,
          Body: JSON.stringify(tripFresh),
          ContentType: "application/json",
        }),
      );
      await finishMarker({
        matched: true,
        tripId,
        devisId,
        messageId,
        duplicate: duplicate && !messageId,
      });
      return;
    }

    if (duplicate || transportDuplicate) {
      await finishMarker({
        matched: true,
        tripId,
        duplicate: true,
        reason: "deja_enregistre",
      });
      return;
    }

    await appendUnmatched(client, bucket, {
      id: `${Date.now()}-${gmailMessageId.slice(-8)}`,
      s3Key,
      fromEmail,
      subject: subject || "",
      gmailMessageId,
      snippet,
      originalFilename,
      createdAt: now,
      extractedPrice: analysis.price,
      extractedCompany: analysis.company,
      guessedTripId: analysis.suggestedTripId,
      matchMotif: analysis.matchMotif,
      matchConfidence: analysis.matchConfidence,
      messageType: analysis.messageType,
      reason: "type_message_non_traite",
    });
    await finishMarker({ matched: false, reason: "type_message_non_traite", tripId });
  } catch (e) {
    console.error("[ingest-from-email] job arrière-plan:", e);
    await writeIngestMarker(client, bucket, markerKey, {
      pending: false,
      completed: true,
      failed: true,
      reason: e instanceof Error ? e.message : "erreur_traitement",
      gmailMessageId,
      s3Key,
    });
    throw e;
  }
}

export async function POST(req: Request) {
  const secret = ingestSecretFromEnv();
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Secret d'ingestion non configuré côté serveur. Sur Amplify, définir TRAVEL_EMAIL_INGEST_SECRET (ou INGEST_SECRET) pour la branche qui déploie ce build, puis redéployer.",
      },
      { status: 503 },
    );
  }
  const hdr = (req.headers.get("x-travel-email-ingest-secret") || "").trim();
  if (hdr !== secret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: {
    s3Key?: string;
    fromEmail?: string;
    subject?: string;
    snippet?: string;
    emailBodyPlain?: string;
    gmailMessageId?: string;
    originalFilename?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { s3Key, fromEmail, subject, snippet, emailBodyPlain, gmailMessageId, originalFilename } = body;
  if (!fromEmail || !gmailMessageId) {
    return NextResponse.json({ error: "fromEmail et gmailMessageId requis" }, { status: 400 });
  }

  const hasPdf = Boolean(s3Key);
  const textContent = (emailBodyPlain || snippet || "").trim();
  if (!hasPdf && textContent.length < 8) {
    return NextResponse.json(
      { error: "s3Key ou emailBodyPlain/snippet requis pour l'analyse IA" },
      { status: 400 },
    );
  }
  if (s3Key && !isAllowedIncomingKey(s3Key)) {
    return NextResponse.json({ error: "Clé S3 non autorisée" }, { status: 400 });
  }

  const bucket = process.env.BUCKET_NAME!;
  const client = s3();
  const markerKey = ingestMarkerKey(gmailMessageId, s3Key);
  const existing = await readIngestMarker(client, bucket, markerKey);
  if (existing?.completed) {
    return NextResponse.json({
      ok: true,
      completed: true,
      duplicate: Boolean(existing.duplicate),
      failed: Boolean(existing.failed),
      matched: existing.matched ?? false,
      tripId: existing.tripId ?? null,
      reason: existing.reason ?? null,
      devisId: existing.devisId ?? null,
      messageId: existing.messageId ?? null,
    });
  }
  if (existing?.pending) {
    const age = existing.startedAt ? Date.now() - new Date(existing.startedAt).getTime() : 0;
    if (!Number.isNaN(age) && age < PENDING_STALE_MS) {
      return NextResponse.json(
        {
          ok: true,
          accepted: true,
          completed: false,
          pending: true,
          detail: "Traitement déjà en cours pour ce message.",
        },
        { status: 202 },
      );
    }
    return NextResponse.json(
      {
        ok: true,
        accepted: true,
        completed: false,
        pending: true,
        detail: "Traitement long en cours — nouvel essai ignoré pour éviter les doublons.",
      },
      { status: 202 },
    );
  }

  await writeIngestMarker(client, bucket, markerKey, {
    pending: true,
    startedAt: new Date().toISOString(),
    gmailMessageId,
    s3Key,
  });

  const candidates = await loadTripCandidates(client, bucket);
  const providerName = providerNameFromEmail(fromEmail) ?? "Transporteur (e-mail)";

  after(() =>
    runIngestBackgroundJob({
      bucket,
      markerKey,
      s3Key,
      fromEmail,
      subject: subject ?? "",
      snippet: snippet ?? "",
      emailBodyPlain,
      gmailMessageId,
      originalFilename,
      candidates,
      providerName,
      hasPdfAttachment: hasPdf,
    }).catch((err) => console.error("[ingest-from-email] after() job:", err)),
  );

  return NextResponse.json(
    {
      ok: true,
      accepted: true,
      completed: false,
      detail:
        "Analyse IA (Mistral) en arrière-plan. La Lambda attend completed:true avant de marquer le mail lu.",
    },
    { status: 202 },
  );
}

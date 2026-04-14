import { createHash } from "crypto";
import { NextResponse, after } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { providerNameFromEmail } from "@/app/lib/transport-providers";
import {  extractDevisAndMatchTripWithMistral,  ocrS3Key, type TripCandidateForMatch} from "@/app/lib/travel-devis-ocr";

const INCOMING_PREFIX = "devis-incoming/";
const UNMATCHED_KEY = "travels/email-devis-unmatched.json";
const INDEX_KEY = "travels/index.json";
const MAX_CANDIDATES = 45;
const MARKER_PREFIX = "travels/email-ingest-markers/";
const PENDING_STALE_MS = 12 * 60 * 1000;

export const maxDuration = 300;

function ingestMarkerKey(gmailMessageId: string, s3Key: string): string {
  const h = createHash("sha256").update(`${gmailMessageId}\0${s3Key}`, "utf8").digest("hex");
  return `${MARKER_PREFIX}${h}.json`;
}

type IngestMarker = {
  pending?: boolean;
  startedAt?: string;
  completed?: boolean;
  duplicate?: boolean;
  matched?: boolean;
  tripId?: string | null;
  reason?: string | null;
  devisId?: string | null;
  updatedAt?: string;
};

async function readIngestMarker( client: S3Client,  bucket: string, key: string): Promise<IngestMarker | null> {
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
    })
  );
}

async function deleteIngestMarker(client: S3Client, bucket: string, key: string) {
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    /* ignore */
  }
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
    const sorted = [...all].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const withTransport = sorted.filter( (t) => Boolean(t.data?.needsBus || t.data?.transportRequest));
    const pool = withTransport.length > 0 ? withTransport : sorted;
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
  s3Key: string;
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
    })
  );
}

function ingestSecretFromEnv(): string | undefined {
  const raw =  process.env.TRAVEL_EMAIL_INGEST_SECRET?.trim() ||  process.env.INGEST_SECRET?.trim();
  return raw || undefined;
}

type IngestJobParams = {
  bucket: string;
  markerKey: string;
  s3Key: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  gmailMessageId: string;
  originalFilename: string | undefined;
  candidates: TripCandidateForMatch[];
  providerName: string;
};

async function runIngestBackgroundJob(p: IngestJobParams): Promise<void> {
  const client = s3();
  const { bucket, markerKey, s3Key, fromEmail, subject, snippet, gmailMessageId, originalFilename, candidates, providerName } = p;

  try {
    let ocrText = "";
    let match = {
      price: null as string | null,
      company: null as string | null,
      contactEmail: null as string | null,
      matchedTripId: null as string | null,
      matchConfidence: null as "high" | "medium" | "low" | null,
      matchMotif: null as string | null,
      suggestedTripId: null as string | null,
      matchReviewRequired: false,
    };
    try {
      ocrText = await ocrS3Key(bucket, s3Key);
      match = await extractDevisAndMatchTripWithMistral(
        ocrText,
        { subject: subject || "", snippet: snippet || "" },
        candidates
      );
    } catch (e) {
      console.error("[ingest-from-email] OCR/Mistral:", e);
    }

    const getCmd = new GetObjectCommand({ Bucket: bucket, Key: s3Key });
    const fileViewUrl = await getSignedUrl(client, getCmd, { expiresIn: 604800 });
    const now = new Date().toISOString();
    const tripId = match.matchedTripId;

    const finishMarker = async (m: IngestMarker) => {
      await writeIngestMarker(client, bucket, markerKey, { ...m, pending: false, completed: true });
    };

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
        extractedPrice: match.price,
        extractedCompany: match.company,
        guessedTripId: match.suggestedTripId,
        matchMotif: match.matchMotif,
        matchConfidence: match.matchConfidence,
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
        extractedPrice: match.price,
        extractedCompany: match.company,
        guessedTripId: match.suggestedTripId,
        matchMotif: match.matchMotif,
        matchConfidence: match.matchConfidence,
        reason: "pas_de_correspondance_mistral",
      });
      await finishMarker({ matched: false, reason: "pas_de_correspondance_mistral", tripId: null });
      return;
    }

    const tripKey = `travels/${tripId}.json`;
    let tripData: Record<string, unknown>;
    try {
      const tripRes = await client.send(new GetObjectCommand({ Bucket: bucket, Key: tripKey }));
      const tripRaw = await tripRes.Body?.transformToString();
      tripData = tripRaw ? JSON.parse(tripRaw) : {};
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
        extractedPrice: match.price,
        extractedCompany: match.company,
        guessedTripId: tripId,
        matchMotif: match.matchMotif,
        matchConfidence: match.matchConfidence,
        reason: "voyage_introuvable_s3",
      });
      await finishMarker({ matched: false, reason: "voyage_introuvable_s3", tripId });
      return;
    }

    const received = Array.isArray(tripData.receivedDevis) ? tripData.receivedDevis : [];
    const already = received.some(
      (d: { gmailMessageId?: string; s3KeyIncoming?: string }) =>
        d.gmailMessageId === gmailMessageId && d.s3KeyIncoming === s3Key
    );
    if (already) {
      await finishMarker({
        matched: true,
        tripId,
        duplicate: true,
        reason: "deja_enregistre",
      });
      return;
    }

    const newDevis = {
      id: Date.now().toString(),
      providerName,
      fileUrl: fileViewUrl,
      providerEmail: fromEmail.trim(),
      createdAt: now,
      source: "email",
      gmailMessageId,
      originalFilename: originalFilename ?? null,
      extractedPrice: match.price,
      extractedCompany: match.company,
      s3KeyIncoming: s3Key,
      matchMethod: "mistral",
      matchConfidence: match.matchConfidence,
      matchMotif: match.matchMotif,
      matchReviewRequired: match.matchReviewRequired,
      extractedContactEmail: match.contactEmail,
    };
    received.push(newDevis);
    tripData.receivedDevis = received;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: tripKey,
        Body: JSON.stringify(tripData),
        ContentType: "application/json",
      })
    );
    await finishMarker({
      matched: true,
      tripId,
      devisId: newDevis.id,
      duplicate: false,
    });
  } catch (e) {
    console.error("[ingest-from-email] job arrière-plan:", e);
    await deleteIngestMarker(client, bucket, markerKey);
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
      { status: 503 }
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
    gmailMessageId?: string;
    originalFilename?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const { s3Key, fromEmail, subject, snippet, gmailMessageId, originalFilename } = body;
  if (!s3Key || !fromEmail || !gmailMessageId) {
    return NextResponse.json(
      { error: "s3Key, fromEmail et gmailMessageId requis" },
      { status: 400 }
    );
  }
  if (!isAllowedIncomingKey(s3Key)) {
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
      duplicate: true,
      matched: existing.matched ?? false,
      tripId: existing.tripId ?? null,
      reason: existing.reason ?? null,
      devisId: existing.devisId ?? null,
    });
  }

  if (existing?.pending && existing.startedAt) {
    const age = Date.now() - new Date(existing.startedAt).getTime();
    if (!Number.isNaN(age) && age < PENDING_STALE_MS) {
      return NextResponse.json(
        {
          ok: true,
          accepted: true,
          completed: false,
          pending: true,
          detail: "Traitement déjà en cours pour ce PDF.",
        },
        { status: 202 }
      );
    }
  }

  await writeIngestMarker(client, bucket, markerKey, {
    pending: true,
    startedAt: new Date().toISOString(),
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
      gmailMessageId,
      originalFilename,
      candidates,
      providerName,
    }).catch((err) => console.error("[ingest-from-email] after() job:", err))
  );

  return NextResponse.json(
    {
      ok: true,
      accepted: true,
      completed: false,
      detail:
        "Textract + Mistral s'exécutent après la réponse HTTP. Relance la Lambda une fois terminé : le 2e appel verra completed:true et pourra marquer le mail lu.",
    },
    { status: 202 }
  );
}

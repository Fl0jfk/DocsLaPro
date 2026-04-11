import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand,} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { providerNameFromEmail } from "@/app/lib/transport-providers";
import { extractDevisMetadataWithMistral, ocrS3Key} from "@/app/lib/travel-devis-ocr";

const INCOMING_PREFIX = "devis-incoming/";
const UNMATCHED_KEY = "travels/email-devis-unmatched.json";

function isAllowedIncomingKey(key: string): boolean {
  if (!key.startsWith(INCOMING_PREFIX) || key.includes("..")) return false;
  return /^devis-incoming\/[a-zA-Z0-9._/-]+$/.test(key);
}

function extractTripIdFromText(...chunks: (string | undefined | null)[]): string | null {
  const combined = chunks.filter(Boolean).join("\n");
  const patterns = [/Réf\.\s*([^\s<]+)/gi,/ref\.\s*([^\s<]+)/gi,/référence\s+dossier[^:]*:\s*([^\s<]+)/gi];
  for (const re of patterns) {
    re.lastIndex = 0;
    const m = re.exec(combined);
    if (m?.[1]) {
      return m[1].replace(/[>,.;:)]+$/, "").trim();
    }
  }
  return null;
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

type UnmatchedItem = { id: string; s3Key: string; fromEmail: string; subject: string; gmailMessageId: string; snippet?: string; originalFilename?: string; createdAt: string; extractedPrice?: string | null; extractedCompany?: string | null; guessedTripId?: string | null;};

async function appendUnmatched(client: S3Client, bucket: string, item: UnmatchedItem) {
  let items: UnmatchedItem[] = [];
  try {
    const res = await client.send( new GetObjectCommand({ Bucket: bucket, Key: UNMATCHED_KEY }));
    const raw = await res.Body?.transformToString();
    if (raw) {
      const parsed = JSON.parse(raw) as { items?: UnmatchedItem[] };
      items = Array.isArray(parsed.items) ? parsed.items : [];
    }
  } catch {
    /* fichier absent */
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
  const raw =
    process.env.TRAVEL_EMAIL_INGEST_SECRET?.trim() ||
    process.env.INGEST_SECRET?.trim();
  return raw || undefined;
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
  } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 })}
  const { s3Key, fromEmail, subject, snippet, gmailMessageId, originalFilename } = body;
  if (!s3Key || !fromEmail || !gmailMessageId) {
    return NextResponse.json({ error: "s3Key, fromEmail et gmailMessageId requis" },{ status: 400 });
  }
  if (!isAllowedIncomingKey(s3Key)) { return NextResponse.json({ error: "Clé S3 non autorisée" }, { status: 400 })}
  const bucket = process.env.BUCKET_NAME!;
  const client = s3();
  const tripId = extractTripIdFromText(subject, snippet);
  const providerName = providerNameFromEmail(fromEmail) ?? "Transporteur (e-mail)";
  let ocrText = "";
  let meta = { price: null as string | null, company: null as string | null };
  try {
    ocrText = await ocrS3Key(bucket, s3Key);
    if (ocrText) { meta = await extractDevisMetadataWithMistral(ocrText)}
  } catch (e) { console.error("[ingest-from-email] OCR/Mistral:", e)}
  const getCmd = new GetObjectCommand({ Bucket: bucket, Key: s3Key });
  const fileViewUrl = await getSignedUrl(client, getCmd, { expiresIn: 604800 });
  const now = new Date().toISOString();
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
      extractedPrice: meta.price,
      extractedCompany: meta.company,
      guessedTripId: null,
    });
    return NextResponse.json({
      ok: true,
      matched: false,
      reason: "reference_introuvable",
      extractedPrice: meta.price,
      extractedCompany: meta.company,
    });
  }

  const tripKey = `travels/${tripId}.json`;
  let tripData: Record<string, unknown>;
  try {
    const tripRes = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: tripKey })
    );
    const tripRaw = await tripRes.Body?.transformToString();
    tripData = tripRaw ? JSON.parse(tripRaw) : {};
  } catch {
    await appendUnmatched(client, bucket, { id: `${Date.now()}-${gmailMessageId.slice(-8)}`, s3Key,  fromEmail,  subject: subject || "",  gmailMessageId,  snippet,  originalFilename,  createdAt: now,  extractedPrice: meta.price, extractedCompany: meta.company,guessedTripId: tripId });
    return NextResponse.json({  ok: true,  matched: false,  reason: "voyage_introuvable",  tripId,  extractedPrice: meta.price,  extractedCompany: meta.company});
  }
  const received = Array.isArray(tripData.receivedDevis) ? tripData.receivedDevis : [];
  const newDevis = {
    id: Date.now().toString(),
    providerName,
    fileUrl: fileViewUrl,
    providerEmail: fromEmail.trim(),
    createdAt: now,
    source: "email",
    gmailMessageId,
    originalFilename: originalFilename ?? null,
    extractedPrice: meta.price,
    extractedCompany: meta.company,
    s3KeyIncoming: s3Key,
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
  return NextResponse.json({ ok: true, matched: true, tripId, extractedPrice: meta.price, extractedCompany: meta.company, devisId: newDevis.id});
}
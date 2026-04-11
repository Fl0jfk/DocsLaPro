import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  diagnoseDevisIngestMatch,
  ocrS3Key,
  type TripCandidateForMatch,
} from "@/app/lib/travel-devis-ocr";
import { resolveIncomingPdfKey } from "@/app/lib/devis-incoming-s3";

const INDEX_KEY = "travels/index.json";
const MAX_CANDIDATES = 45;

/** Textract + Mistral peuvent dépasser 10 s ; Amplify / Vercel honorent maxDuration quand supporté. */
export const maxDuration = 120;

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
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    const withTransport = sorted.filter(
      (t) => Boolean(t.data?.needsBus || t.data?.transportRequest)
    );
    const pool = withTransport.length > 0 ? withTransport : sorted;
    return pool.slice(0, MAX_CANDIDATES).map((t) => {
      const d = t.data || {};
      const classes =
        Array.isArray(d.classes) ? d.classes.join(", ") : String(d.classes || "");
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

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { s3Key?: string; subject?: string; snippet?: string; useLatest?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const subject = body.subject ?? "";
  const snippet = body.snippet ?? "";

  const bucket = process.env.BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json({ error: "BUCKET_NAME manquant" }, { status: 503 });
  }

  const client = s3();
  const resolved = await resolveIncomingPdfKey(client, bucket, body.s3Key, Boolean(body.useLatest));
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }
  const s3Key = resolved.key;

  const candidates = await loadTripCandidates(client, bucket);

  const ocrStarted = Date.now();
  const ocrText = await ocrS3Key(bucket, s3Key);
  const ocrMs = Date.now() - ocrStarted;

  const mistralStarted = Date.now();
  const diagnostic = await diagnoseDevisIngestMatch(ocrText, { subject, snippet }, candidates);
  const mistralMs = Date.now() - mistralStarted;

  return NextResponse.json({
    s3Key,
    timingsMs: { ocr: ocrMs, mistralAndInterpret: mistralMs },
    ...diagnostic,
  });
}

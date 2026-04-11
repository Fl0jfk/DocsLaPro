import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { diagnoseDevisIngestMatch, type TripCandidateForMatch } from "@/app/lib/travel-devis-ocr";

export const maxDuration = 120;

const INDEX_KEY = "travels/index.json";
const MAX_CANDIDATES = 45;

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

  let body: { ocrText?: string; subject?: string; snippet?: string; s3Key?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const ocrText = body.ocrText ?? "";
  if (typeof ocrText !== "string") {
    return NextResponse.json({ error: "ocrText requis (texte renvoyé par l’étape Textract)" }, { status: 400 });
  }

  const bucket = process.env.BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json({ error: "BUCKET_NAME manquant" }, { status: 503 });
  }

  const client = s3();
  const candidates = await loadTripCandidates(client, bucket);

  const started = Date.now();
  const diagnostic = await diagnoseDevisIngestMatch(ocrText, {
    subject: body.subject ?? "",
    snippet: body.snippet ?? "",
  }, candidates);
  const durationMs = Date.now() - started;

  return NextResponse.json({
    step: "mistral",
    s3Key: body.s3Key ?? null,
    timingsMs: { mistralAndInterpret: durationMs },
    ...diagnostic,
  });
}

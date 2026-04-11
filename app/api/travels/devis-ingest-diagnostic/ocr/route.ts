import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client } from "@aws-sdk/client-s3";
import { ocrS3Key } from "@/app/lib/travel-devis-ocr";
import { resolveIncomingPdfKey } from "@/app/lib/devis-incoming-s3";

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

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { s3Key?: string; useLatest?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const bucket = process.env.BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json({ error: "BUCKET_NAME manquant" }, { status: 503 });
  }

  const client = s3();
  const resolved = await resolveIncomingPdfKey(client, bucket, body.s3Key, Boolean(body.useLatest));
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const started = Date.now();
  const ocrText = await ocrS3Key(bucket, resolved.key);
  const durationMs = Date.now() - started;

  return NextResponse.json({
    step: "ocr",
    s3Key: resolved.key,
    ocrCharCount: ocrText.length,
    ocrText,
    durationMs,
    ocrEmpty: ocrText.length === 0,
  });
}

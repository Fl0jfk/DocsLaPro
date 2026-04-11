import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client } from "@aws-sdk/client-s3";
import { listIncomingPdfs } from "@/app/lib/devis-incoming-s3";

function s3() {
  return new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json({ error: "BUCKET_NAME manquant" }, { status: 503 });
  }
  try {
    const { pdfs, groups, latest } = await listIncomingPdfs(s3(), bucket);
    return NextResponse.json({
      scannedAt: new Date().toISOString(),
      totalPdfs: pdfs.length,
      latest,
      groups,
    });
  } catch (e) {
    console.error("[devis-incoming-list]", e);
    return NextResponse.json(
      { error: String((e as Error)?.message || e) },
      { status: 500 }
    );
  }
}

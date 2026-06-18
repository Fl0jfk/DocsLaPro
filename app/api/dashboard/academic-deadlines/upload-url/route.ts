import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAcademicDeadlinesEditor } from "@/app/lib/intranet-auth";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getBucketName } from "@/app/lib/s3-storage";
import { s3Key } from "@/app/lib/s3-path";

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "circulaire.pdf";
}

export async function POST(req: Request) {
  const gate = await requireAcademicDeadlinesEditor();
  if (!gate.ok) return gate.response;

  try {
    const { fileName } = await req.json();
    const fileKey = s3Key(
      `dashboard/academic-deadlines/uploads/${Date.now()}-${safeFileName(String(fileName || "circulaire.pdf"))}`,
    );
    const s3Client = await getTenantDataS3Client();
    const bucket = await getBucketName();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: "application/pdf",
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return NextResponse.json({ uploadUrl, key: fileKey });
  } catch (e) {
    console.error("[dashboard/academic-deadlines/upload-url]", e);
    return NextResponse.json({ error: "Erreur lors de la préparation de l'upload." }, { status: 500 });
  }
}

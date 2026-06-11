import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAdmin } from "@/app/lib/intranet-auth";
import { getBucketName } from "@/app/lib/s3-storage";
import { s3Key } from "@/app/lib/s3-path";
import { publicS3UrlForKey } from "@/app/lib/travels-s3";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "logo";
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  try {
    const { fileName, fileType } = await req.json();
    const type = String(fileType || "").trim().toLowerCase();
    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez PNG, JPEG, WebP ou SVG." },
        { status: 400 },
      );
    }

    const ext = type === "image/svg+xml" ? "svg" : type.split("/")[1] || "png";
    const fileKey = s3Key(`settings/branding/header-logo-${Date.now()}-${safeFileName(String(fileName || `logo.${ext}`))}`);
    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });

    const bucket = getBucketName();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: type,
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({
      uploadUrl,
      fileUrl: publicS3UrlForKey(fileKey),
    });
  } catch (error) {
    console.error("[settings/upload-logo]", error);
    return NextResponse.json({ error: "Erreur lors de la préparation de l'upload." }, { status: 500 });
  }
}

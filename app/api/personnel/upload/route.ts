import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { currentUser } from "@clerk/nextjs/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { getBucketName } from "@/app/lib/s3-storage";
import { s3Key } from "@/app/lib/s3-path";
import { publicS3UrlForKey } from "@/app/lib/travels-s3";
import { canAccessPersonnelModule } from "@/app/lib/personnel-types";

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? rolesRaw.map(String) : rolesRaw ? [String(rolesRaw)] : [];
  if (!canAccessPersonnelModule(roles)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  try {
    const { fileName, fileType, staffId } = await req.json();
    const safeName = String(fileName || "document").replace(/[^a-zA-Z0-9._-]/g, "_");
    const folder = staffId ? `personnel-ogec/${staffId}/documents` : "personnel-ogec/shared";
    const fileKey = s3Key(`${folder}/${Date.now()}-${safeName}`);

    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });

    const command = new PutObjectCommand({
      Bucket: await getBucketName(),
      Key: fileKey,
      ContentType: String(fileType || "application/octet-stream"),
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({
      uploadUrl,
      fileUrl: await publicS3UrlForKey(fileKey),
      s3Key: fileKey,
    });
  } catch (error) {
    console.error("[personnel/upload]", error);
    return NextResponse.json({ error: "Erreur upload." }, { status: 500 });
  }
}

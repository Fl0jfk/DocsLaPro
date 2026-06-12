import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "@/app/lib/intranet-auth";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getTenantAwsRegion, getTenantImageBucket } from "@/app/lib/tenant-config";
import { s3Key } from "@/app/lib/s3-path";

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const rel = `news/${Date.now()}-${file.name}`;
    const key = s3Key(rel);
    const imageBucket = await getTenantImageBucket();
    const s3 = await getTenantDataS3Client();

    await s3.send(
      new PutObjectCommand({
        Bucket: imageBucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    const region = await getTenantAwsRegion();
    const fileUrl = `https://${imageBucket}.s3.${region}.amazonaws.com/${key}`;
    return NextResponse.json({ fileUrl });
  } catch (err) {
    console.error("Erreur upload image news:", err);
    return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
  }
}

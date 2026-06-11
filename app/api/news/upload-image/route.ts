import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "@/app/lib/intranet-auth";
import { s3Key } from "@/app/lib/s3-path";

const IMAGE_BUCKET = "docslaproimage";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const rel = `news/${Date.now()}-${file.name}`;
    const key = s3Key( rel);

    await s3.send(
      new PutObjectCommand({
        Bucket: IMAGE_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    const fileUrl = `https://${IMAGE_BUCKET}.s3.${process.env.REGION}.amazonaws.com/${key}`;
    return NextResponse.json({ fileUrl });
  } catch (err) {
    console.error("Erreur upload image news:", err);
    return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
  }
}

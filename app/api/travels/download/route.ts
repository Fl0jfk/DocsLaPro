import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { resolveTravelsS3ObjectKey } from "@/app/lib/travels-s3";
import { requireAuth } from "@/app/lib/intranet-auth";

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  try {
    const { fileUrl, s3Key: explicitKey } = await req.json();
    if (!fileUrl && !explicitKey) {
      return NextResponse.json({ error: "URL ou clé S3 manquante." }, { status: 400 });
    }

    const key = await resolveTravelsS3ObjectKey(String(fileUrl || ""), explicitKey ? String(explicitKey) : null);
    if (!key) {
      return NextResponse.json(
        { error: "Fichier introuvable sur le stockage (clé S3 non résolue)." },
        { status: 404 },
      );
    }

    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });
    const command = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: key });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error("Erreur signature S3:", error);
    return NextResponse.json({ error: "Impossible de générer le lien." }, { status: 500 });
  }
}

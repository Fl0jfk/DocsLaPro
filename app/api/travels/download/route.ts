import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { parseTravelsS3KeyFromUrl } from "@/app/lib/travels-s3";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  try {
    const { fileUrl } = await req.json();
    const key = parseTravelsS3KeyFromUrl(fileUrl);
    if (!key) {
      return NextResponse.json({ error: "URL de fichier non reconnue" }, { status: 400 });
    }
    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {  accessKeyId: process.env.ACCESS_KEY_ID!, secretAccessKey: process.env.SECRET_ACCESS_KEY!},
    });
    const command = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: key});
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error("Erreur signature S3:", error);
    return NextResponse.json({ error: "Impossible de générer le lien" }, { status: 500 });
  }
}
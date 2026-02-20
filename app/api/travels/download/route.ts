import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  try {
    const { fileUrl } = await req.json();
    const key = fileUrl.split(`${process.env.BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/`)[1];
    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error("Erreur signature S3:", error);
    return NextResponse.json({ error: "Impossible de générer le lien" }, { status: 500 });
  }
}
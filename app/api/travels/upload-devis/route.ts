import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: Request) { 
  try {
    const { fileName, fileType, tripId, providerName } = await req.json();
    const cleanProvider = providerName.replace(/\s+/g, "_");
    const fileKey = `devis/${tripId}/${Date.now()}-${cleanProvider}-${fileName}`;
    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return NextResponse.json({ 
      uploadUrl, 
      fileUrl: `https://${process.env.BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${fileKey}`
    });
  } catch (error) {
    console.error("Erreur S3 Public:", error);
    return NextResponse.json({ error: "Erreur génération upload" }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: Request) {
  const { userId } = await auth(); 
  
  if (!userId) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  try {
    const { id, data } = await req.json();

    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `travels/${id}.json`,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    });

    await s3Client.send(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur S3:", error);
    return NextResponse.json({ error: "Échec écriture S3" }, { status: 500 });
  }
}
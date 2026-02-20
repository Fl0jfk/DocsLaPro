import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(req: Request) {
   const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return new NextResponse("ID manquant", { status: 400 });
  try {
    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `travels/${id}.json`,
    });
    const response = await s3Client.send(command);
    const tripData = await response.Body?.transformToString();
    if (!tripData) { return NextResponse.json({ error: "Fichier vide" }, { status: 404 })}
    return NextResponse.json(JSON.parse(tripData));
  } catch (error) {
    console.error("Erreur S3 Get:", error);
    return NextResponse.json({ error: "Impossible de récupérer le dossier" }, { status: 500 });
  }
}
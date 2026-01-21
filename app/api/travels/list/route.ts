import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });

  const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });

  try {
    // 1. Lister les fichiers dans le dossier trips/
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.BUCKET_NAME,
      Prefix: 'travels/',
    });

    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents) return NextResponse.json([]);

    // 2. Pour chaque fichier, on va lire son contenu
    const trips = await Promise.all(
      listResponse.Contents.map(async (file) => {
        const getCommand = new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: file.Key,
        });
        const tripRes = await s3Client.send(getCommand);
        const body = await tripRes.Body?.transformToString();
        return body ? JSON.parse(body) : null;
      })
    );

    // Filtrer les nuls et trier par date
    const validTrips = trips.filter(t => t !== null);
    
    return NextResponse.json(validTrips);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur S3" }, { status: 500 });
  }
}
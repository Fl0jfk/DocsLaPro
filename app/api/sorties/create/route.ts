// app/api/sorties/create/route.ts
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'eu-west-3' });

export async function POST(req: Request) {
  const { userId } = getAuth(req as any);
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const sortie = await req.json();
  const id = Date.now().toString();
  // Ajoute l'id et l'état à la sortie
  const sortieComplete = {
    ...sortie,
    id,
    etat: 'en_attente',
  };
  console.log('Nouvelle demande de sortie reçue :', sortieComplete);

  const key = `sorties/${id}.json`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Body: JSON.stringify(sortieComplete),
    ContentType: 'application/json',
  }));
  console.log('Sortie sauvegardée sur S3 :', key);

  return NextResponse.json({ success: true, key });
}

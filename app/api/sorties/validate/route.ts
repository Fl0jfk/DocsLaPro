// app/api/sorties/validate/route.ts
import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getAuth } from '@clerk/nextjs/server';

const s3 = new S3Client({ region: 'eu-west-3' });

export async function POST(req: Request) {
  const { userId } = getAuth(req as any);
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await req.json();
  const key = `sorties/${id}.json`;

  // Récupère la sortie
  const getCommand = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
  });
  const obj = await s3.send(getCommand);
  const body = await obj.Body?.transformToString();
  const sortie = JSON.parse(body || '{}');

  // Met à jour la sortie
  sortie.etat = 'valide';
  sortie.validatedBy = userId;

  // Sauvegarde la sortie
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Body: JSON.stringify(sortie),
    ContentType: 'application/json',
  }));

  return NextResponse.json({ success: true });
}
  
// app/api/sorties/list/route.ts
import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getAuth } from '@clerk/nextjs/server';
import { Readable } from 'stream';

const s3 = new S3Client({ region: 'eu-west-3' });

async function streamToString(stream: Readable): Promise<string> {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function GET(req: Request) { // <-- Ici, ajoute req: Request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { userId } = getAuth(req as any);
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  // Liste tous les fichiers sous sorties/
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Prefix: 'sorties/',
  });
  const response = await s3.send(command);
  const files = response.Contents?.filter(f => f.Key?.endsWith('.json')) || [];

  // Récupère le contenu de chaque fichier
  const sorties = [];
  for (const file of files) {
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: file.Key!,
    });
    const obj = await s3.send(getCommand);
    const body = await streamToString(obj.Body as Readable);
    const sortie = JSON.parse(body);
    sorties.push(sortie);
  }

  // Filtre les sorties en attente de validation
  const sortiesEnAttente = sorties.filter(s => s.etat === 'en_attente');

  return NextResponse.json(sortiesEnAttente);
}

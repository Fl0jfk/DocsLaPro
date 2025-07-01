// app/api/sorties/upload-document/route.ts
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'eu-west-3' });

export async function POST(req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { userId } = getAuth(req as any);
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  console.log('Fichier reçu :', file.name);

  const key = `sorties/${Date.now()}_${file.name}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
  }));
  console.log('Fichier uploadé sur S3 :', key);

  return NextResponse.json({ key });
}

// app/api/eleves/update-fiche/route.ts
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'eu-west-3' });

export async function POST(req: Request) {
  const { dossier, fiche } = await req.json();
  const bucket = process.env.AWS_S3_BUCKET_NAME!;
  const key = `${dossier}fiche.json`;
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(fiche, null, 2),
    ContentType: 'application/json',
  }));
  return NextResponse.json({ success: true });
}

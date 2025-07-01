// app/api/sorties/upload-devis/route.ts
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getAuth } from '@clerk/nextjs/server';

const s3 = new S3Client({ region: 'eu-west-3' });

export async function POST(req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { userId } = getAuth(req as any);
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const sortieId = formData.get('sortieId') as string;
  const compagnie = formData.get('compagnie') as string;

  const key = `sorties/${sortieId}/devis_${compagnie}_${Date.now()}.pdf`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
  }));

  // Met à jour la sortie pour ajouter le devis
  // ...

  return NextResponse.json({ success: true, key });
}

import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getAuth } from '@clerk/nextjs/server';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'eu-west-3' });

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const body = await req.json();
    if (!body.filename || !body.contentType) {
      return NextResponse.json({ error: 'filename et contentType requis' }, { status: 400 });
    }
    const key = `uploads-temp/${Date.now()}_${body.filename}`;
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: key,
      ContentType: body.contentType,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return NextResponse.json({ url, key });
  } catch (error) {
    console.error('Erreur génération URL signée S3:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

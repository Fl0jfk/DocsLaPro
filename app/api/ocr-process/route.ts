import { NextResponse } from 'next/server';
import { TextractClient, StartDocumentTextDetectionCommand } from '@aws-sdk/client-textract';
import { getAuth } from '@clerk/nextjs/server';

const textract = new TextractClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: 'key requis' }, { status: 400 });
    const bucket = process.env.BUCKET_NAME!;
    const command = new StartDocumentTextDetectionCommand({ DocumentLocation: { S3Object: { Bucket: bucket, Name: key } },});
    const result = await textract.send(command);
    console.log(2)
    return NextResponse.json({ jobId: result.JobId, key });
  } catch (error) {
    console.error('Erreur lancement Textract:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

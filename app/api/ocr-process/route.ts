import { NextResponse } from 'next/server';
import { TextractClient, StartDocumentTextDetectionCommand } from '@aws-sdk/client-textract';
import { getAuth } from '@clerk/nextjs/server';

const textract = new TextractClient({ region: 'eu-west-3' });

export async function POST(req: Request) {
  const { userId } = getAuth(req as any);
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { key } = await req.json();
  const bucket = process.env.AWS_S3_BUCKET_NAME!;
  const command = new StartDocumentTextDetectionCommand({
    DocumentLocation: { S3Object: { Bucket: bucket, Name: key } },
  });
  const result = await textract.send(command);
  return NextResponse.json({ jobId: result.JobId, key });
}

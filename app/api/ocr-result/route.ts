import { NextResponse } from 'next/server';
import { TextractClient, GetDocumentTextDetectionCommand } from '@aws-sdk/client-textract';
import { getAuth } from '@clerk/nextjs/server';

const textract = new TextractClient({ region: 'eu-west-3' });

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { userId } = getAuth(req as any);
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { jobId } = await req.json();
  const command = new GetDocumentTextDetectionCommand({ JobId: jobId });
  const result = await textract.send(command);
  if (result.JobStatus === 'SUCCEEDED') {
    const text = result.Blocks?.map(b => b.Text).join(' ');
    return NextResponse.json({ text });
  } else {
    return NextResponse.json({ status: result.JobStatus });
  }
}

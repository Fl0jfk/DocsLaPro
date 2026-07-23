import { resolveSession } from "@/app/lib/intranet-session";
import { NextResponse } from 'next/server';
import { startTextractForS3Key } from "@/app/lib/ocr-textract";
import { getBucketName } from "@/app/lib/s3-storage";

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await resolveSession();
    const userId = session?.userId;
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: 'key requis' }, { status: 400 });
    // getBucketName appelé pour valider le contexte tenant, mais le jobId est géré par la façade OCR
    await getBucketName();
    const jobId = await startTextractForS3Key(key);
    return NextResponse.json({ jobId, key });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

import { resolveSession } from "@/app/lib/intranet-session";
import { NextResponse } from 'next/server';
import { pollTextractOnce } from "@/app/lib/ocr-textract";

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await resolveSession();
    const userId = session?.userId;
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const { jobId } = await req.json();
    if (!jobId) return NextResponse.json({ error: 'jobId requis' }, { status: 400 });

    const poll = await pollTextractOnce(jobId);

    if (poll.status === "SUCCEEDED") {
      return NextResponse.json({
        text: poll.result.text,
        pageTexts: poll.result.pageTexts,
        pageCount: poll.result.pageCount,
      });
    }

    if (poll.status === "IN_PROGRESS") {
      return NextResponse.json({ status: "IN_PROGRESS" });
    }

    return NextResponse.json({ status: "FAILED", error: "OCR échoué" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

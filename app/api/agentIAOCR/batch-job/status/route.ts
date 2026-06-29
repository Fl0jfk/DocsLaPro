import { NextResponse } from "next/server";
import { resolveSession } from "@/app/lib/intranet-session";
import { buildBatchProgressView } from "@/app/lib/ocr-batch-progress";
import { readBatchJob } from "../batch-job";

export const maxDuration = 10;

export async function GET(req: Request) {
  const session = await resolveSession();
  const userId = session?.userId;
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });

  const jobId = new URL(req.url).searchParams.get("jobId")?.trim();
  if (!jobId || !/^[a-zA-Z0-9_-]{8,128}$/.test(jobId)) {
    return NextResponse.json({ error: "jobId invalide." }, { status: 400 });
  }

  const job = await readBatchJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Traitement introuvable." }, { status: 404 });
  }
  if (job.userId !== userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const serverManaged = Boolean(job.originUrl?.trim() && process.env.OCR_WORKER_SECRET?.trim());
  const progress = buildBatchProgressView(job);

  return NextResponse.json({
    jobId: job.jobId,
    status: job.status,
    label: progress.label,
    percent: progress.percent,
    completed: progress.documentsSucceeded,
    failed: progress.documentsFailed,
    totalItems: job.items.length,
    currentItemIndex: job.currentItemIndex,
    results: job.results,
    error: job.error ?? null,
    startedAt: job.startedAt,
    updatedAt: job.updatedAt,
    serverManaged,
    progress,
  });
}

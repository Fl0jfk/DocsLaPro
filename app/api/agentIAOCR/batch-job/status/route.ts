import { NextResponse } from "next/server";
import { resolveSession } from "@/app/lib/intranet-session";
import { buildBatchProgressView } from "@/app/lib/ocr-batch-progress";
import {
  isBatchJobStale,
  kickOcrBatchWorker,
  recordWorkerKick,
  resolveWorkerOrigin,
  shouldKickWorkerFromStatus,
} from "@/app/lib/ocr-batch-process";
import { ocrTrace } from "@/app/lib/ocr-trace";
import { flushOcrJobTraces, getOcrJobTraceTail } from "@/app/lib/ocr-job-trace-store";
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

  const origin = resolveWorkerOrigin(job);
  const serverSelfRelays = Boolean(process.env.OCR_WORKER_SECRET?.trim() && origin);
  const serverManaged = serverSelfRelays;

  const stale = isBatchJobStale(job);
  const shouldKick = shouldKickWorkerFromStatus(job);
  const cur = job.items[job.currentItemIndex];
  ocrTrace(job.jobId, "api", "status", "poll status client", {
    userId,
    stale,
    shouldKick,
    serverSelfRelays,
    status: job.status,
    percent: job.percent,
    label: job.label,
    currentItemIndex: job.currentItemIndex,
    totalItems: job.items.length,
    resultsOk: job.results.filter((r) => r.success).length,
    resultsKo: job.results.filter((r) => !r.success).length,
    currentItem: cur
      ? {
          fileName: cur.fileName,
          mode: cur.mode,
          phase: cur.phase ?? "ocr_start",
          ocrPagesRead: cur.ocrPagesRead ?? null,
          pdfPageCount: cur.pdfPageCount ?? null,
          segmentIndex: cur.segmentIndex ?? null,
          segmentsTotal: cur.segments?.length ?? null,
        }
      : null,
  });

  if (shouldKick) {
    ocrTrace(job.jobId, "api", "status-kick", "relance worker depuis status (lot bloqué ou pending)", {
      status: job.status,
      processingStartedAt: job.processingStartedAt ?? null,
    }, "warn");
    void kickOcrBatchWorker(job.jobId, origin)
      .then(() => recordWorkerKick(job.jobId))
      .catch((err) =>
        ocrTrace(job.jobId, "api", "status-kick-fail", "relance stale depuis status échouée", {
          error: err instanceof Error ? err.message : String(err),
        }, "error"),
      );
  }

  await flushOcrJobTraces(job.jobId);
  const freshJob = (await readBatchJob(job.jobId)) ?? job;
  const traceLog = getOcrJobTraceTail(freshJob);

  const progress = buildBatchProgressView(freshJob);

  return NextResponse.json({
    jobId: freshJob.jobId,
    status: freshJob.status,
    label: progress.label,
    percent: progress.percent,
    completed: progress.documentsSucceeded,
    failed: progress.documentsFailed,
    totalItems: freshJob.items.length,
    currentItemIndex: freshJob.currentItemIndex,
    results: freshJob.results,
    error: freshJob.error ?? null,
    startedAt: freshJob.startedAt,
    updatedAt: freshJob.updatedAt,
    serverManaged,
    serverSelfRelays,
    traceLog,
    progress,
  });
}

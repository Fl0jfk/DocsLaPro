import { after, NextResponse } from "next/server";
import { resolveSession } from "@/app/lib/intranet-session";
import { readBatchJob } from "../batch-job";
import { kickOcrBatchWorker, resolveWorkerOrigin, runOcrBatchJob } from "@/app/lib/ocr-batch-process";
import { ocrTrace, summarizeBatchJob } from "@/app/lib/ocr-trace";

/**
 * Réponse HTTP rapide — le worker tourne via after() en micro-étapes non bloquantes.
 * maxDuration élevé pour laisser le worker enchaîner plusieurs items par invocation
 * (il s'auto-limite via RUN_BUDGET_MS bien en deçà de ce plafond).
 */
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await resolveSession();
  const userId = session?.userId;
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });

  let body: { jobId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
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

  if (job.status === "completed") {
    return NextResponse.json({ ok: true, status: "completed" }, { status: 200 });
  }
  if (job.status === "failed") {
    return NextResponse.json(
      { ok: false, status: "failed", error: job.error ?? null },
      { status: 200 },
    );
  }
  if (job.status === "needs_token") {
    return NextResponse.json(
      { ok: false, status: "needs_token", error: job.error ?? null },
      { status: 200 },
    );
  }

  ocrTrace(jobId, "api", "process", "process déclenché par client", {
    userId,
    jobStatus: job.status,
    ...summarizeBatchJob(job),
  });
  const origin = resolveWorkerOrigin(job);
  if (process.env.OCR_WORKER_SECRET?.trim() && origin) {
    await kickOcrBatchWorker(jobId, origin).catch((err) =>
      ocrTrace(jobId, "api", "process-kick-fail", "échec kick process", {
        error: err instanceof Error ? err.message : String(err),
      }, "error"),
    );
  } else {
    ocrTrace(jobId, "api", "process-after", "repli after() (pas de chaîne HTTP)", {
      hasSecret: Boolean(process.env.OCR_WORKER_SECRET?.trim()),
      origin: origin ?? null,
    }, "warn");
    after(() =>
      runOcrBatchJob(jobId).catch((err) =>
        ocrTrace(jobId, "api", "process-after-error", "process after() en erreur", {
          error: err instanceof Error ? err.message : String(err),
        }, "error"),
      ),
    );
  }

  return NextResponse.json(
    { ok: true, accepted: true, detail: "Traitement OCR relancé en arrière-plan." },
    { status: 202 },
  );
}

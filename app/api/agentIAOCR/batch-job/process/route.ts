import { after, NextResponse } from "next/server";
import { resolveSession } from "@/app/lib/intranet-session";
import { readBatchJob } from "../batch-job";
import { runOcrBatchJob } from "@/app/lib/ocr-batch-process";

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

  // Le worker gère lui-même le verrou, la planification (nextRunAt) et les micro-étapes.
  console.log(`[ocr-batch ${jobId}] process déclenché (client, user=${userId})`);
  after(() =>
    runOcrBatchJob(jobId).catch((err) => console.error(`[ocr-batch ${jobId}] process after():`, err)),
  );

  return NextResponse.json(
    { ok: true, accepted: true, detail: "Traitement OCR relancé en arrière-plan." },
    { status: 202 },
  );
}

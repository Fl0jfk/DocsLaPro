import { NextResponse } from "next/server";
import { resolveSession } from "@/app/lib/intranet-session";
import { readBatchJob } from "../batch-job";
import { runOcrBatchJob, tryClaimBatchJob } from "@/app/lib/ocr-batch-process";

export const maxDuration = 300;

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

  const claimed = await tryClaimBatchJob(jobId);
  if (claimed) {
    try {
      await runOcrBatchJob(jobId);
    } catch (err) {
      console.error("[ocr-batch/process]", err);
    }
    const final = await readBatchJob(jobId);
    if (final?.status === "completed") {
      return NextResponse.json({ ok: true, status: "completed" }, { status: 200 });
    }
    if (final?.status === "failed") {
      return NextResponse.json(
        { ok: false, status: "failed", error: final.error ?? null },
        { status: 200 },
      );
    }
    if (final?.status === "needs_token") {
      return NextResponse.json(
        { ok: false, status: "needs_token", error: final.error ?? null },
        { status: 200 },
      );
    }
  }

  return NextResponse.json(
    {
      ok: true,
      accepted: true,
      claimed,
      detail: claimed
        ? "Traitement OCR en cours sur le serveur."
        : "Traitement déjà en cours ; le suivi continue.",
    },
    { status: 202 },
  );
}

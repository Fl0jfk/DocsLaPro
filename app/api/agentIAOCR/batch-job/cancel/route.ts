import { NextResponse } from "next/server";
import { resolveSession } from "@/app/lib/intranet-session";
import { readBatchJob } from "../batch-job";
import { cancelBatchJob } from "@/app/lib/ocr-batch-process";

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

  const cancelled = await cancelBatchJob(jobId);
  if (!cancelled) {
    return NextResponse.json({ error: "Impossible d'annuler ce traitement." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: cancelled.status,
    completed: cancelled.completed,
    failed: cancelled.failed,
    results: cancelled.results,
  });
}

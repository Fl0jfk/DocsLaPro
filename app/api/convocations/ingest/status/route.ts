import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { readIngestJob, canIngestFromUser } from "../ingest-job";
import { runConvocationIngestJob, tryClaimIngestJob } from "@/app/lib/convocation-ingest-process";

/** Peut durer le temps de l'OCR + Mistral quand le poll déclenche le traitement. */
export const maxDuration = 300;

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });

  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  if (!canIngestFromUser(roles)) {
    return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  }

  const jobId = new URL(req.url).searchParams.get("jobId")?.trim();
  if (!jobId || !/^[a-zA-Z0-9_-]{8,128}$/.test(jobId)) {
    return NextResponse.json({ error: "jobId invalide." }, { status: 400 });
  }

  let job = await readIngestJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Import introuvable ou expiré." }, { status: 404 });
  }
  if (job.userId !== userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  if (job.status === "pending" || job.status === "processing") {
    const claimed = await tryClaimIngestJob(jobId);
    if (claimed) {
      await runConvocationIngestJob(jobId, job.documentKey, job.sourceFileName);
      job = (await readIngestJob(jobId)) ?? job;
    } else {
      job = (await readIngestJob(jobId)) ?? job;
    }
  }

  return NextResponse.json({
    jobId,
    status: job.status,
    phase: job.phase ?? null,
    error: job.error ?? null,
    code: job.code ?? null,
    created: job.created ?? null,
    parsed: job.parsed ?? null,
    startedAt: job.startedAt,
    updatedAt: job.updatedAt,
  });
}

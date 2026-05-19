import { NextResponse, after } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { readIngestJob, canIngestFromUser } from "../ingest-job";
import { runConvocationIngestJob, tryClaimIngestJob } from "@/app/lib/convocation-ingest-process";

/** Réponse immédiate ; le travail lourd part en after(). */
export const maxDuration = 30;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });

  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  if (!canIngestFromUser(roles)) {
    return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  }

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

  const job = await readIngestJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Import introuvable ou expiré." }, { status: 404 });
  }
  if (job.userId !== userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  if (job.status === "completed") {
    return NextResponse.json({ ok: true, status: "completed", created: job.created ?? null }, { status: 200 });
  }
  if (job.status === "failed") {
    return NextResponse.json(
      { ok: false, status: "failed", error: job.error ?? null, code: job.code ?? null },
      { status: 200 },
    );
  }

  const claimed = await tryClaimIngestJob(jobId);
  if (claimed) {
    const docKey = job.documentKey;
    const fileName = job.sourceFileName;
    after(() =>
      runConvocationIngestJob(jobId, docKey, fileName).catch((err) =>
        console.error("[convocations/ingest/process] after():", err),
      ),
    );
  }

  return NextResponse.json(
    {
      ok: true,
      accepted: true,
      claimed,
      detail: claimed
        ? "Traitement OCR + IA démarré en arrière-plan."
        : "Traitement déjà en cours ou file d'attente ; le suivi continue.",
    },
    { status: 202 },
  );
}

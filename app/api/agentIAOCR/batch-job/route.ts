import { after, NextResponse } from "next/server";
import { resolveSession } from "@/app/lib/intranet-session";
import { requireAuth } from "@/app/lib/intranet-auth";
import {
  newBatchJobId,
  registerBatchJobForUser,
  writeBatchJob,
  type OcrBatchJob,
  type OcrBatchJobItem,
} from "./batch-job";
import { runOcrBatchJob } from "@/app/lib/ocr-batch-process";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await resolveSession();
  const userId = session?.userId;
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  let body: {
    accessToken?: string;
    items?: Array<{
      fileName?: string;
      mode?: string;
      s3Key?: string;
      tempPath?: string;
    }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";
  if (!accessToken) {
    return NextResponse.json({ error: "accessToken requis" }, { status: 400 });
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items: OcrBatchJobItem[] = rawItems
    .filter((it) => it?.s3Key && it?.fileName && it?.tempPath)
    .map((it, idx) => ({
      id: `item_${idx + 1}`,
      fileName: String(it.fileName),
      mode: it.mode === "class" ? "class" : "standard",
      s3Key: String(it.s3Key),
      tempPath: String(it.tempPath),
      status: "pending" as const,
    }));

  if (items.length === 0) {
    return NextResponse.json({ error: "Aucun fichier valide dans la file." }, { status: 400 });
  }

  const jobId = newBatchJobId();
  const now = new Date().toISOString();
  const job: OcrBatchJob = {
    jobId,
    userId,
    status: "pending",
    startedAt: now,
    updatedAt: now,
    accessToken,
    items,
    currentItemIndex: 0,
    results: [],
    label: `File d'attente — ${items.length} PDF`,
    percent: 0,
    completed: 0,
    failed: 0,
  };

  await writeBatchJob(job);
  await registerBatchJobForUser(userId, jobId);

  after(() => runOcrBatchJob(jobId).catch((err) => console.error("[ocr-batch] after():", err)));

  return NextResponse.json({ ok: true, jobId, total: items.length }, { status: 201 });
}

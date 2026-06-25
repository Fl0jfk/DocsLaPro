import "server-only";

import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  readBatchJob,
  writeBatchJob,
  type OcrBatchJob,
  type OcrBatchResult,
} from "@/app/api/agentIAOCR/batch-job/batch-job";
import { analyzeDocMatchEleve } from "@/app/lib/ocr-analyze-eleve";
import { extractPdfPagesBytes } from "@/app/lib/ocr-extract-pages";
import {
  deleteOneDrivePath,
  moveOneDriveFile,
  uploadBytesToOneDrive,
} from "@/app/lib/ocr-graph-ops";
import { runDocumentSegmentation } from "@/app/lib/ocr-segment-run";
import { runTextractForS3Key } from "@/app/lib/ocr-textract";
import { buildTextFromPages } from "@/app/lib/eleves-config";
import { getOneDriveProfileForClerkUser } from "@/app/lib/onedrive-user-profiles";
import { getClerkClientForTenant } from "@/app/lib/tenant-clerk";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getBucketName } from "@/app/lib/s3-storage";

const RUN_LOCK_PREFIX = "agentIAOCR/batch-locks/";
const PROCESSING_ACTIVE_MS = 120_000;
const RUN_BUDGET_MS = 240_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function runLockKey(jobId: string) {
  return `${RUN_LOCK_PREFIX}${jobId}.lock`;
}

async function acquireRunLock(jobId: string): Promise<boolean> {
  const s3Client = await getTenantDataS3Client();
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: await getBucketName(),
        Key: runLockKey(jobId),
        Body: JSON.stringify({ acquiredAt: new Date().toISOString() }),
        ContentType: "application/json",
        IfNoneMatch: "*",
      }),
    );
    return true;
  } catch (e: unknown) {
    const meta = (e as { $metadata?: { httpStatusCode?: number } }).$metadata;
    const name = (e as { name?: string }).name;
    if (meta?.httpStatusCode === 412 || name === "PreconditionFailed") return false;
    throw e;
  }
}

async function releaseRunLock(jobId: string) {
  const s3Client = await getTenantDataS3Client();
  try {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: await getBucketName(), Key: runLockKey(jobId) }),
    );
  } catch {
    /* ignore */
  }
}

function interFileDelayMs(processedCount: number, totalEstimate: number) {
  const base = totalEstimate >= 100 ? 3500 : totalEstimate >= 50 ? 2800 : 2000;
  const extra = Math.floor(processedCount / 25) * 1500;
  return Math.min(12_000, base + extra);
}

function segmentTempFileName(originalName: string, pageStart: number, pageEnd: number, index: number) {
  const base = originalName.replace(/\.pdf$/i, "").replace(/[<>:"/\\|?*]/g, "_");
  return `Temp/${base}_p${pageStart}-${pageEnd}_${index + 1}.pdf`;
}

function computeProgress(job: OcrBatchJob) {
  const totalItems = job.items.length;
  const doneItems = job.currentItemIndex;
  const itemResults = job.results.length;
  const completed = job.results.filter((r) => r.success).length;
  const failed = job.results.filter((r) => !r.success).length;
  const percent =
    totalItems > 0
      ? Math.min(99, Math.round((doneItems / totalItems) * 100))
      : itemResults > 0
        ? 100
        : 0;
  return { percent, completed, failed, totalItems, doneItems };
}

async function patchJob(jobId: string, patch: Partial<OcrBatchJob>) {
  const job = await readBatchJob(jobId);
  if (!job) return null;
  const next = { ...job, ...patch, updatedAt: new Date().toISOString() };
  await writeBatchJob(next);
  return next;
}

async function getOdProfileForUser(userId: string) {
  const clerk = await getClerkClientForTenant();
  const user = await clerk.users.getUser(userId);
  return getOneDriveProfileForClerkUser({
    lastName: user.lastName,
    emailAddresses: user.emailAddresses?.map((e) => ({ emailAddress: e.emailAddress })),
    primaryEmailAddress: user.primaryEmailAddress
      ? { emailAddress: user.primaryEmailAddress.emailAddress }
      : null,
  });
}

class TokenExpiredError extends Error {
  constructor() {
    super("Session OneDrive expirée");
    this.name = "TokenExpiredError";
  }
}

async function analyzeAndMove(
  accessToken: string,
  text: string,
  sourcePath: string,
  displayName: string,
  odProfile: Awaited<ReturnType<typeof getOdProfileForUser>>,
): Promise<OcrBatchResult> {
  try {
    const ai = await analyzeDocMatchEleve(text, odProfile);
    if (!ai?.fileName) {
      return {
        success: false,
        error: "Analyse IA incomplète.",
        fileName: displayName,
        result: ai,
        tempOneDrivePath: sourcePath,
      };
    }
    if (!ai.oneDriveFolderPath) {
      return {
        success: false,
        error:
          "Élève non identifié — le fichier reste dans Temp. Rangez-le à la main ou repassez-le en mode Standard.",
        fileName: displayName,
        result: ai,
        tempOneDrivePath: sourcePath,
      };
    }
    const move = await moveOneDriveFile(
      accessToken,
      sourcePath,
      ai.oneDriveFolderPath,
      `${ai.fileName}.pdf`,
    );
    if (!move.ok) {
      if (move.status === 401) throw new TokenExpiredError();
      return {
        success: false,
        error: `Déplacement impossible : ${move.detail.slice(0, 200)}`,
        fileName: displayName,
        result: ai,
        tempOneDrivePath: sourcePath,
      };
    }
    return { success: true, result: ai, fileName: displayName };
  } catch (err) {
    if (err instanceof TokenExpiredError) throw err;
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      fileName: displayName,
      tempOneDrivePath: sourcePath,
    };
  }
}

async function processStandardItem(
  job: OcrBatchJob,
  itemIndex: number,
  odProfile: Awaited<ReturnType<typeof getOdProfileForUser>>,
): Promise<OcrBatchResult[]> {
  const item = job.items[itemIndex];
  await patchJob(job.jobId, {
    label: `OCR — ${item.fileName}`,
    items: job.items.map((it, i) => (i === itemIndex ? { ...it, status: "processing" } : it)),
  });

  const ocr = await runTextractForS3Key(item.s3Key);
  await patchJob(job.jobId, { label: `Classement — ${item.fileName}` });
  const result = await analyzeAndMove(job.accessToken, ocr.text, item.tempPath, item.fileName, odProfile);
  return [result];
}

async function processClassItem(
  job: OcrBatchJob,
  itemIndex: number,
  odProfile: Awaited<ReturnType<typeof getOdProfileForUser>>,
): Promise<OcrBatchResult[]> {
  const item = job.items[itemIndex];
  const results: OcrBatchResult[] = [];
  const sourceTempPath = item.tempPath;

  await patchJob(job.jobId, {
    label: `OCR classe — ${item.fileName}`,
    items: job.items.map((it, i) => (i === itemIndex ? { ...it, status: "processing" } : it)),
  });

  const ocr = await runTextractForS3Key(item.s3Key, 90);
  await patchJob(job.jobId, { label: `Découpage — ${item.fileName}` });

  const segData = await runDocumentSegmentation({
    pageTexts: ocr.pageTexts,
    pageCount: ocr.pageCount,
  });
  const segments = segData.segments || [];
  const mode = segData.mode;

  if (mode === "single" || segments.length <= 1) {
    const seg = segments[0] || { pageStart: 1, pageEnd: ocr.pageCount || 1 };
    const slice = buildTextFromPages(ocr.pageTexts, seg.pageStart, seg.pageEnd, ocr.text);
    const one = await analyzeAndMove(
      job.accessToken,
      slice || ocr.text,
      sourceTempPath,
      item.fileName,
      odProfile,
    );
    return [one];
  }

  await deleteOneDrivePath(job.accessToken, sourceTempPath);
  const segmentTotal = segments.length;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const label = `${item.fileName} [p.${seg.pageStart}-${seg.pageEnd}]`;
    await patchJob(job.jobId, {
      label: `Segment ${i + 1}/${segmentTotal} — ${label}`,
    });

    let tempSegPath: string | undefined;
    try {
      const slice = buildTextFromPages(ocr.pageTexts, seg.pageStart, seg.pageEnd, ocr.text);
      if (!slice.trim()) {
        results.push({
          success: false,
          error: "Aucun texte OCR sur ce segment.",
          fileName: label,
        });
        continue;
      }

      const pdfBytes = await extractPdfPagesBytes(item.s3Key, seg.pageStart, seg.pageEnd);
      tempSegPath = segmentTempFileName(item.fileName, seg.pageStart, seg.pageEnd, i);
      const upload = await uploadBytesToOneDrive(job.accessToken, tempSegPath, pdfBytes);
      if (!upload.ok) {
        if (upload.status === 401) throw new TokenExpiredError();
        throw new Error(`Upload segment OneDrive : ${upload.detail}`);
      }

      const ai = await analyzeDocMatchEleve(slice, odProfile);
      if (!ai?.fileName || !ai.oneDriveFolderPath) {
        results.push({
          success: false,
          error: "Élève non identifié sur ce segment — PDF laissé dans Temp.",
          fileName: label,
          result: ai,
          tempOneDrivePath: tempSegPath,
        });
        continue;
      }

      const move = await moveOneDriveFile(
        job.accessToken,
        tempSegPath,
        ai.oneDriveFolderPath,
        `${ai.fileName}.pdf`,
      );
      if (!move.ok) {
        if (move.status === 401) throw new TokenExpiredError();
        throw new Error(move.detail);
      }
      results.push({ success: true, result: ai, fileName: label });
    } catch (segErr) {
      if (segErr instanceof TokenExpiredError) throw segErr;
      const msg = segErr instanceof Error ? segErr.message : String(segErr);
      results.push({
        success: false,
        error: tempSegPath ? `${msg} — document laissé dans Temp.` : msg,
        fileName: label,
        tempOneDrivePath: tempSegPath,
      });
    }
    await sleep(800);
  }

  return results;
}

export async function tryClaimBatchJob(jobId: string): Promise<boolean> {
  const job = await readBatchJob(jobId);
  if (!job) return false;
  if (job.status === "completed" || job.status === "failed" || job.status === "needs_token") {
    return false;
  }

  if (job.status === "processing" && job.processingStartedAt) {
    const age = Date.now() - new Date(job.processingStartedAt).getTime();
    if (age < PROCESSING_ACTIVE_MS) return false;
    console.warn("[ocr-batch] reprise job stale", jobId, age);
    await releaseRunLock(jobId);
  }

  if (job.status !== "pending" && job.status !== "processing") return false;

  await writeBatchJob({
    ...job,
    status: "processing",
    processingStartedAt: new Date().toISOString(),
    label: job.label || "Traitement en cours…",
  });
  return true;
}

export async function runOcrBatchJob(jobId: string) {
  const existing = await readBatchJob(jobId);
  if (!existing) return;
  if (existing.status === "completed" || existing.status === "failed") return;

  if (!(await acquireRunLock(jobId))) return;

  let job = await readBatchJob(jobId);
  if (!job || job.status === "completed" || job.status === "failed") {
    await releaseRunLock(jobId);
    return;
  }

  const startedAt = Date.now();
  const odProfile = await getOdProfileForUser(job.userId);

  try {
    while (job.currentItemIndex < job.items.length) {
      if (Date.now() - startedAt > RUN_BUDGET_MS) {
        await patchJob(jobId, {
          status: "processing",
          label: `Pause serveur — reprise automatique (${job.currentItemIndex}/${job.items.length})…`,
        });
        break;
      }

      const itemIndex = job.currentItemIndex;
      const item = job.items[itemIndex];

      try {
        const itemResults =
          item.mode === "class"
            ? await processClassItem(job, itemIndex, odProfile)
            : await processStandardItem(job, itemIndex, odProfile);

        job = (await patchJob(jobId, {
          results: [...job.results, ...itemResults],
          items: job.items.map((it, i) =>
            i === itemIndex ? { ...it, status: itemResults.every((r) => r.success) ? "done" : "failed" } : it,
          ),
          currentItemIndex: itemIndex + 1,
          ...computeProgress({
            ...job,
            currentItemIndex: itemIndex + 1,
            results: [...job.results, ...itemResults],
          }),
        }))!;

        if (itemIndex + 1 < job.items.length) {
          let pauseMs = interFileDelayMs(itemIndex + 1, job.items.length);
          if ((itemIndex + 1) % 25 === 0) pauseMs += 10_000;
          await patchJob(jobId, {
            label: `Pause Graph (${itemIndex + 1}/${job.items.length})…`,
          });
          await sleep(pauseMs);
        }
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          await patchJob(jobId, {
            status: "needs_token",
            error: "Session OneDrive expirée. Reconnectez Microsoft sur la page pour reprendre.",
            label: "En attente de reconnexion OneDrive…",
          });
          break;
        }
        const message = err instanceof Error ? err.message : String(err);
        job = (await patchJob(jobId, {
          results: [
            ...job.results,
            { success: false, error: message, fileName: item.fileName, tempOneDrivePath: item.tempPath },
          ],
          items: job.items.map((it, i) => (i === itemIndex ? { ...it, status: "failed" } : it)),
          currentItemIndex: itemIndex + 1,
        }))!;
      }

      job = (await readBatchJob(jobId))!;
      if (!job || job.status === "needs_token") break;
    }

    job = (await readBatchJob(jobId))!;
    if (!job || job.status === "needs_token") return;

    if (job.currentItemIndex >= job.items.length) {
      const completed = job.results.filter((r) => r.success).length;
      const failed = job.results.filter((r) => !r.success).length;
      await patchJob(jobId, {
        status: "completed",
        percent: 100,
        completed,
        failed,
        label: `Terminé — ${job.results.length} document${job.results.length > 1 ? "s" : ""} traité${job.results.length > 1 ? "s" : ""}`,
      });
    } else {
      const prog = computeProgress(job);
      await patchJob(jobId, {
        status: "processing",
        percent: prog.percent,
        completed: prog.completed,
        failed: prog.failed,
      });
    }
  } catch (error) {
    console.error("[ocr-batch]", error);
    const j = await readBatchJob(jobId);
    if (j && j.status !== "completed") {
      await patchJob(jobId, {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        label: "Échec du traitement",
      });
    }
  } finally {
    await releaseRunLock(jobId);
  }
}

export async function resumeBatchJobWithToken(jobId: string, accessToken: string) {
  const job = await readBatchJob(jobId);
  if (!job) return null;
  if (job.status !== "needs_token") return job;
  const next = {
    ...job,
    accessToken,
    status: "processing" as const,
    error: undefined,
    processingStartedAt: new Date().toISOString(),
    label: "Reprise du traitement…",
  };
  await writeBatchJob(next);
  return next;
}

/** Met à jour le token OneDrive sur un job actif (sans interrompre le traitement). */
export async function refreshBatchJobAccessToken(jobId: string, accessToken: string) {
  const job = await readBatchJob(jobId);
  if (!job) return null;
  if (job.status === "completed" || job.status === "failed") return job;
  await writeBatchJob({ ...job, accessToken });
  return job;
}

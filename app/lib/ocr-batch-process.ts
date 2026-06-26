import "server-only";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  ocrCacheKey,
  readBatchJob,
  readOcrCache,
  writeBatchJob,
  writeOcrCache,
  type OcrBatchJob,
  type OcrBatchJobItem,
  type OcrBatchResult,
  type OcrBatchSegment,
} from "@/app/api/agentIAOCR/batch-job/batch-job";
import { analyzeDocMatchEleve } from "@/app/lib/ocr-analyze-eleve";
import { extractPdfPagesBytes } from "@/app/lib/ocr-extract-pages";
import {
  deleteOneDrivePath,
  moveOneDriveFile,
  uploadBytesToOneDrive,
} from "@/app/lib/ocr-graph-ops";
import { runDocumentSegmentation } from "@/app/lib/ocr-segment-run";
import { pollTextractOnce, startTextractForS3Key } from "@/app/lib/ocr-textract";
import { buildTextFromPages } from "@/app/lib/eleves-config";
import { resolveOneDriveProfileForClerkUserServer } from "@/app/lib/onedrive-user-profiles.server";
import type { OneDriveUserProfile } from "@/app/lib/onedrive-user-profiles";
import { getMicrosoftAccessTokenFromRefresh } from "@/app/lib/graph-microsoft-delegated";
import { getClerkClientForTenant } from "@/app/lib/tenant-clerk";
import { getTenant } from "@/app/lib/tenant-context";
import { getTenantSecrets } from "@/app/lib/tenant-registry";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getBucketName } from "@/app/lib/s3-storage";

const RUN_LOCK_PREFIX = "agentIAOCR/batch-locks/";
/** Au-delà de cet âge, un lock est considéré orphelin (worker tué) et peut être volé. */
const LOCK_TTL_MS = 75_000;
/** Budget d'une invocation `after()` — on s'arrête bien avant le timeout de la fonction. */
const RUN_BUDGET_MS = 50_000;
/** Délai entre deux tours de polling Textract. */
const OCR_POLL_DELAY_MS = 3_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Log serveur traçable dans CloudWatch (préfixe greppable). */
function log(jobId: string, ...args: unknown[]) {
  console.log(`[ocr-batch ${jobId}]`, ...args);
}

function runLockKey(jobId: string) {
  return `${RUN_LOCK_PREFIX}${jobId}.lock`;
}

async function readLockAcquiredAt(jobId: string): Promise<number | null> {
  const s3Client = await getTenantDataS3Client();
  try {
    const res = await s3Client.send(
      new GetObjectCommand({ Bucket: await getBucketName(), Key: runLockKey(jobId) }),
    );
    const raw = await res.Body?.transformToString();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { acquiredAt?: string };
    const t = parsed.acquiredAt ? new Date(parsed.acquiredAt).getTime() : NaN;
    return Number.isNaN(t) ? null : t;
  } catch {
    return null;
  }
}

async function putLock(jobId: string): Promise<boolean> {
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

/** Acquiert le lock ; vole un lock orphelin (worker précédent tué sans libération). */
async function acquireRunLock(jobId: string): Promise<boolean> {
  if (await putLock(jobId)) return true;

  const acquiredAt = await readLockAcquiredAt(jobId);
  if (acquiredAt !== null && Date.now() - acquiredAt < LOCK_TTL_MS) return false;

  await releaseRunLock(jobId);
  return putLock(jobId);
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

/**
 * Auto-relance serveur : ré-invoque le worker via un endpoint interne (secret partagé),
 * pour que le lot se termine même si l'onglet est fermé. Sans secret/origine → no-op
 * (on retombe sur le ré-déclenchement par le navigateur tant qu'il est ouvert).
 */
async function fireSelfChain(originUrl: string | undefined, jobId: string, delayMs: number) {
  const secret = process.env.OCR_WORKER_SECRET?.trim();
  if (!secret || !originUrl) return;
  try {
    await fetch(`${originUrl.replace(/\/+$/, "")}/api/agentIAOCR/batch-job/internal-run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ocr-worker-secret": secret },
      body: JSON.stringify({ jobId, delayMs }),
    });
  } catch (err) {
    console.error("[ocr-batch] auto-relance échouée:", err);
  }
}

async function deleteOcrCacheForJob(job: OcrBatchJob) {
  const s3Client = await getTenantDataS3Client();
  const bucket = await getBucketName();
  await Promise.all(
    job.items
      .map((it) => it.ocrCacheKey)
      .filter((k): k is string => Boolean(k))
      .map((Key) =>
        s3Client
          .send(new DeleteObjectCommand({ Bucket: bucket, Key }))
          .catch(() => undefined),
      ),
  );
}

function segmentTempFileName(originalName: string, pageStart: number, pageEnd: number, index: number) {
  const base = originalName.replace(/\.pdf$/i, "").replace(/[<>:"/\\|?*]/g, "_");
  return `Temp/${base}_p${pageStart}-${pageEnd}_${index + 1}.pdf`;
}

function computeProgress(job: OcrBatchJob) {
  const totalItems = job.items.length;
  const doneItems = job.currentItemIndex;
  const completed = job.results.filter((r) => r.success).length;
  const failed = job.results.filter((r) => !r.success).length;
  const percent = totalItems > 0 ? Math.min(99, Math.round((doneItems / totalItems) * 100)) : 0;
  return { percent, completed, failed };
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
  return resolveOneDriveProfileForClerkUserServer({
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

/**
 * Contexte d'exécution : porte le token courant et sait le renouveler côté serveur
 * (refresh token du job ou refresh token délégué par cycle dans les secrets tenant).
 */
type WorkerCtx = {
  jobId: string;
  token: string;
  odProfile: OneDriveUserProfile | null;
  refreshToken: string | null;
};

async function resolveServerRefreshToken(
  job: OcrBatchJob,
  odProfile: OneDriveUserProfile | null,
): Promise<string | null> {
  if (job.refreshToken?.trim()) return job.refreshToken.trim();
  if (!odProfile) return null;
  try {
    const tenant = await getTenant();
    const secrets = await getTenantSecrets(tenant.slug);
    const rt = secrets?.microsoft?.oneDriveBySecteur?.[odProfile.secteur]?.refreshToken;
    return rt?.trim() || null;
  } catch {
    return null;
  }
}

/** Tente un renouvellement serveur du token (sans onglet ouvert). */
async function tryServerTokenRefresh(ctx: WorkerCtx): Promise<boolean> {
  if (!ctx.refreshToken) return false;
  const res = await getMicrosoftAccessTokenFromRefresh(ctx.refreshToken);
  if ("error" in res) return false;
  ctx.token = res.accessToken;
  await patchJob(ctx.jobId, { accessToken: res.accessToken });
  return true;
}

/**
 * Rejoue une opération Graph en gérant un 401 :
 *  → tente un refresh serveur, sinon lève TokenExpiredError (le job passera needs_token).
 */
async function withToken<T extends { ok: boolean; status?: number }>(
  ctx: WorkerCtx,
  op: (token: string) => Promise<T>,
): Promise<T> {
  let res = await op(ctx.token);
  if (res.ok || res.status !== 401) return res;
  if (await tryServerTokenRefresh(ctx)) {
    res = await op(ctx.token);
    if (res.ok || res.status !== 401) return res;
  }
  throw new TokenExpiredError();
}

type StepOutcome =
  | { kind: "continue"; label?: string }
  | { kind: "wait"; delayMs: number; label?: string }
  | { kind: "result"; results: OcrBatchResult[]; itemDone: boolean; label?: string };

async function patchItem(
  jobId: string,
  itemIndex: number,
  patch: Partial<OcrBatchJobItem>,
  extra?: Partial<OcrBatchJob>,
) {
  const job = await readBatchJob(jobId);
  if (!job) return;
  await writeBatchJob({
    ...job,
    ...extra,
    items: job.items.map((it, i) => (i === itemIndex ? { ...it, ...patch } : it)),
    updatedAt: new Date().toISOString(),
  });
}

async function analyzeAndMove(
  ctx: WorkerCtx,
  text: string,
  sourcePath: string,
  displayName: string,
): Promise<OcrBatchResult> {
  const ai = await analyzeDocMatchEleve(text, ctx.odProfile);
  const extracted = `nom=${ai?.nom ?? "?"} prénom=${ai?.prénom ?? "?"} ine=${ai?.ine ?? "?"}`;
  log(ctx.jobId, `analyse "${displayName}" → ${extracted}`, "match:", JSON.stringify(ai?.matchDebug ?? {}));

  if (!ai?.fileName) {
    log(ctx.jobId, `ÉCHEC "${displayName}" : analyse IA incomplète (pas de nom de fichier).`);
    return {
      success: false,
      error: "Analyse IA incomplète.",
      fileName: displayName,
      result: ai,
      tempOneDrivePath: sourcePath,
    };
  }
  if (!ai.oneDriveFolderPath) {
    log(
      ctx.jobId,
      `NON RANGÉ "${displayName}" : élève non identifié (profilOneDrive=${ctx.odProfile ? ctx.odProfile.secteur : "AUCUN"}).`,
    );
    return {
      success: false,
      error:
        "Élève non identifié — le fichier reste dans Temp. Rangez-le à la main ou repassez-le en mode Standard.",
      fileName: displayName,
      result: ai,
      tempOneDrivePath: sourcePath,
    };
  }
  const move = await withToken(ctx, (token) =>
    moveOneDriveFile(token, sourcePath, ai.oneDriveFolderPath as string, `${ai.fileName}.pdf`),
  );
  if (!move.ok) {
    log(ctx.jobId, `ÉCHEC TECHNIQUE "${displayName}" : déplacement (${move.status}) ${move.detail.slice(0, 200)}`);
    return {
      success: false,
      error: `Déplacement impossible : ${move.detail.slice(0, 200)}`,
      fileName: displayName,
      result: ai,
      tempOneDrivePath: sourcePath,
    };
  }
  log(ctx.jobId, `OK "${displayName}" → ${ai.oneDriveFolderPath}/${ai.fileName}.pdf`);
  return { success: true, result: ai, fileName: displayName };
}

/** Exécute une seule micro-étape de l'item courant. Ne bloque jamais longtemps. */
async function stepItem(
  ctx: WorkerCtx,
  job: OcrBatchJob,
  itemIndex: number,
): Promise<StepOutcome> {
  const item = job.items[itemIndex];
  const phase = item.phase ?? "ocr_start";

  if (phase === "ocr_start") {
    const textractJobId = await startTextractForS3Key(item.s3Key);
    log(job.jobId, `Textract lancé "${item.fileName}" (${item.mode}, phase=${phase})`);
    await patchItem(job.jobId, itemIndex, {
      status: "processing",
      phase: "ocr_poll",
      textractJobId,
    });
    return { kind: "wait", delayMs: OCR_POLL_DELAY_MS, label: `OCR — ${item.fileName}` };
  }

  if (phase === "ocr_poll") {
    if (!item.textractJobId) {
      await patchItem(job.jobId, itemIndex, { phase: "ocr_start" });
      return { kind: "continue" };
    }
    const poll = await pollTextractOnce(item.textractJobId);
    if (poll.status === "IN_PROGRESS") {
      return { kind: "wait", delayMs: OCR_POLL_DELAY_MS, label: `Lecture OCR — ${item.fileName}` };
    }
    if (poll.status === "FAILED") {
      log(job.jobId, `ÉCHEC TECHNIQUE "${item.fileName}" : OCR Textract a échoué.`);
      return {
        kind: "result",
        itemDone: true,
        results: [
          {
            success: false,
            error: "OCR Textract a échoué sur ce fichier.",
            fileName: item.fileName,
            tempOneDrivePath: item.tempPath,
          },
        ],
      };
    }
    const cacheKey = ocrCacheKey(job.jobId, item.id);
    await writeOcrCache(cacheKey, poll.result);
    // Un PDF d'une seule page ne peut pas être découpé : on saute la segmentation.
    const needsSegmentation = item.mode === "class" && (poll.result.pageCount ?? 1) > 1;
    const nextPhase = needsSegmentation ? "segmenting" : "analyze";
    log(
      job.jobId,
      `OCR OK "${item.fileName}" — ${poll.result.pageCount} page(s) → phase=${nextPhase}`,
    );
    await patchItem(job.jobId, itemIndex, {
      ocrCacheKey: cacheKey,
      phase: nextPhase,
    });
    return { kind: "continue", label: `Classement — ${item.fileName}` };
  }

  const ocr = item.ocrCacheKey ? await readOcrCache(item.ocrCacheKey) : null;
  if (!ocr) {
    await patchItem(job.jobId, itemIndex, { phase: "ocr_start", textractJobId: undefined });
    return { kind: "continue" };
  }

  if (phase === "analyze") {
    const result = await analyzeAndMove(ctx, ocr.text, item.tempPath, item.fileName);
    return { kind: "result", results: [result], itemDone: true };
  }

  if (phase === "segmenting") {
    const segData = await runDocumentSegmentation({
      pageTexts: ocr.pageTexts,
      pageCount: ocr.pageCount,
    });
    const segments = (segData.segments || []) as OcrBatchSegment[];
    log(
      job.jobId,
      `Segmentation "${item.fileName}" → mode=${segData.mode}, ${segments.length} segment(s), ${ocr.pageCount} page(s)`,
    );

    if (segData.mode === "single" || segments.length <= 1) {
      const seg = segments[0] || { pageStart: 1, pageEnd: ocr.pageCount || 1 };
      const slice = buildTextFromPages(ocr.pageTexts, seg.pageStart, seg.pageEnd, ocr.text);
      const one = await analyzeAndMove(ctx, slice || ocr.text, item.tempPath, item.fileName);
      return { kind: "result", results: [one], itemDone: true };
    }

    // L'original (classe entière) n'est PAS supprimé ici : il ne le sera qu'une fois
    // tous les morceaux déposés dans Temp, pour ne jamais perdre la source.
    await patchItem(job.jobId, itemIndex, { phase: "segments", segments, segmentIndex: 0 });
    return { kind: "continue", label: `Découpage — ${item.fileName}` };
  }

  // phase === "segments"
  const segments = item.segments ?? [];
  const segIndex = item.segmentIndex ?? 0;
  const total = segments.length;
  if (segIndex >= total) {
    return { kind: "result", results: [], itemDone: true };
  }

  const seg = segments[segIndex];
  const label = `${item.fileName} [p.${seg.pageStart}-${seg.pageEnd}]`;
  const isLast = segIndex + 1 >= total;
  let segResult: OcrBatchResult;
  let tempSegPath: string | undefined;

  try {
    // 1) On dépose TOUJOURS le morceau dans Temp avant toute analyse : ainsi aucun bloc
    //    n'est perdu si l'analyse échoue ou si l'élève n'est pas identifié.
    const pdfBytes = await extractPdfPagesBytes(item.s3Key, seg.pageStart, seg.pageEnd);
    tempSegPath = segmentTempFileName(item.fileName, seg.pageStart, seg.pageEnd, segIndex);
    const segPath = tempSegPath;
    const upload = await withToken(ctx, (token) => uploadBytesToOneDrive(token, segPath, pdfBytes));
    if (!upload.ok) {
      throw new Error(`Upload segment OneDrive : ${upload.detail}`);
    }
    log(job.jobId, `Segment déposé Temp "${label}" → ${tempSegPath}`);

    // 2) Texte du segment. S'il est vide, le morceau reste dans Temp (jamais perdu).
    const slice = buildTextFromPages(ocr.pageTexts, seg.pageStart, seg.pageEnd, ocr.text);
    if (!slice.trim()) {
      log(job.jobId, `Segment texte vide "${label}" — morceau laissé dans Temp.`);
      segResult = {
        success: false,
        error: "Texte du segment vide — morceau laissé dans Temp, à classer à la main.",
        fileName: label,
        tempOneDrivePath: tempSegPath,
      };
    } else {
      segResult = await analyzeAndMove(ctx, slice, tempSegPath, label);
    }
  } catch (segErr) {
    if (segErr instanceof TokenExpiredError) throw segErr;
    const msg = segErr instanceof Error ? segErr.message : String(segErr);
    log(job.jobId, `ÉCHEC TECHNIQUE segment "${label}" : ${msg}`);
    segResult = {
      success: false,
      error: tempSegPath ? `${msg} — document laissé dans Temp.` : msg,
      fileName: label,
      tempOneDrivePath: tempSegPath,
    };
  }

  // Une fois le DERNIER morceau déposé, on supprime l'original (classe entière) du Temp.
  if (isLast) {
    try {
      await withToken(ctx, async (token) => {
        await deleteOneDrivePath(token, item.tempPath);
        return { ok: true as const };
      });
      log(job.jobId, `Original supprimé Temp "${item.tempPath}" (dernier segment traité).`);
    } catch (delErr) {
      if (delErr instanceof TokenExpiredError) throw delErr;
      log(job.jobId, `Suppression original Temp échouée "${item.tempPath}" :`, delErr);
    }
  }

  await patchItem(job.jobId, itemIndex, { segmentIndex: segIndex + 1 });
  return {
    kind: "result",
    results: [segResult],
    itemDone: isLast,
    label: `Segment ${segIndex + 1}/${total} — ${item.fileName}`,
  };
}

export async function runOcrBatchJob(jobId: string) {
  const pre = await readBatchJob(jobId);
  if (!pre) return;
  if (pre.status === "completed" || pre.status === "failed" || pre.status === "needs_token") return;
  if (pre.nextRunAt && Date.now() < new Date(pre.nextRunAt).getTime()) return;

  if (!(await acquireRunLock(jobId))) {
    log(jobId, "lock non acquis — une autre invocation traite déjà ce lot (ou lock récent).");
    return;
  }

  // Délai d'auto-relance serveur : > 0 si le worker s'interrompt avec du travail restant.
  let chainDelayMs: number | null = null;
  const originUrl = pre.originUrl;

  try {
    let job = await readBatchJob(jobId);
    if (!job || job.status === "completed" || job.status === "failed") return;

    const odProfile = await getOdProfileForUser(job.userId);
    const ctx: WorkerCtx = {
      jobId,
      token: job.accessToken,
      odProfile,
      refreshToken: await resolveServerRefreshToken(job, odProfile),
    };
    log(
      jobId,
      `démarrage — ${job.items.length} item(s), reprise à ${job.currentItemIndex}, ` +
        `profilOneDrive=${odProfile ? `${odProfile.secteur} (${odProfile.basePath})` : "AUCUN ⚠️"}, ` +
        `refreshTokenServeur=${ctx.refreshToken ? "oui" : "non"}`,
    );
    if (!odProfile) {
      log(
        jobId,
        "⚠️ AUCUN profil OneDrive → risque « élève non identifié ». Vérifier Paramètres → Intégrations.",
      );
    }

    await patchJob(jobId, {
      status: "processing",
      processingStartedAt: new Date().toISOString(),
      nextRunAt: undefined,
    });

    const startedAt = Date.now();

    while (true) {
      if (Date.now() - startedAt > RUN_BUDGET_MS) {
        log(
          jobId,
          `budget épuisé (${RUN_BUDGET_MS}ms) — reprise planifiée à l'item ${job.currentItemIndex}/${job.items.length}.`,
        );
        await patchJob(jobId, {
          status: "processing",
          nextRunAt: new Date().toISOString(),
          label: `Reprise automatique… (${job.currentItemIndex}/${job.items.length})`,
        });
        chainDelayMs = 0;
        return;
      }

      job = await readBatchJob(jobId);
      if (!job || job.status === "failed" || job.status === "completed" || job.status === "needs_token") {
        return;
      }

      if (job.currentItemIndex >= job.items.length) {
        const completed = job.results.filter((r) => r.success).length;
        const failed = job.results.filter((r) => !r.success).length;
        await patchJob(jobId, {
          status: "completed",
          percent: 100,
          completed,
          failed,
          nextRunAt: undefined,
          label: `Terminé — ${job.results.length} document${job.results.length > 1 ? "s" : ""} traité${job.results.length > 1 ? "s" : ""}`,
        });
        log(jobId, `TERMINÉ — ${completed} succès / ${failed} échec(s) sur ${job.results.length} résultat(s)`);
        await deleteOcrCacheForJob(job);
        return;
      }

      const itemIndex = job.currentItemIndex;
      const item = job.items[itemIndex];

      try {
        const outcome = await stepItem(ctx, job, itemIndex);

        if (outcome.kind === "wait") {
          // Attente OCR utile : on patiente DANS le budget (jamais de blocage > timeout),
          // pour que les lots usuels se terminent en une seule invocation (onglet fermable).
          if (Date.now() - startedAt + outcome.delayMs < RUN_BUDGET_MS) {
            if (outcome.label) await patchJob(jobId, { label: outcome.label });
            await sleep(outcome.delayMs);
            continue;
          }
          // Budget presque épuisé : on planifie une reprise (client ou invocation suivante).
          await patchJob(jobId, {
            status: "processing",
            nextRunAt: new Date(Date.now() + outcome.delayMs).toISOString(),
            label: outcome.label ?? job.label,
          });
          chainDelayMs = outcome.delayMs;
          return;
        }

        if (outcome.kind === "continue") {
          if (outcome.label) await patchJob(jobId, { label: outcome.label });
          continue;
        }

        // outcome.kind === "result"
        const current = await readBatchJob(jobId);
        if (!current) return;
        const nextResults = [...current.results, ...outcome.results];
        const nextIndex = outcome.itemDone ? itemIndex + 1 : itemIndex;
        const prog = computeProgress({ ...current, results: nextResults, currentItemIndex: nextIndex });
        await writeBatchJob({
          ...current,
          results: nextResults,
          currentItemIndex: nextIndex,
          items: current.items.map((it, i) =>
            i === itemIndex && outcome.itemDone
              ? { ...it, status: outcome.results.every((r) => r.success) ? "done" : "failed" }
              : it,
          ),
          percent: prog.percent,
          completed: prog.completed,
          failed: prog.failed,
          label: outcome.label ?? current.label,
          updatedAt: new Date().toISOString(),
        });
        continue;
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          log(jobId, `needs_token — session OneDrive expirée sur "${item.fileName}".`);
          await patchJob(jobId, {
            status: "needs_token",
            error: "Session OneDrive expirée. Reconnectez Microsoft sur la page pour reprendre.",
            label: "En attente de reconnexion OneDrive…",
          });
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        log(jobId, `ÉCHEC TECHNIQUE "${item.fileName}" : ${message}`);
        const current = await readBatchJob(jobId);
        if (!current) return;
        await writeBatchJob({
          ...current,
          results: [
            ...current.results,
            { success: false, error: message, fileName: item.fileName, tempOneDrivePath: item.tempPath },
          ],
          items: current.items.map((it, i) =>
            i === itemIndex ? { ...it, status: "failed" } : it,
          ),
          currentItemIndex: itemIndex + 1,
          updatedAt: new Date().toISOString(),
        });
        continue;
      }
    }
  } catch (error) {
    console.error(`[ocr-batch ${jobId}]`, error);
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
    // Lock libéré → on peut relancer une invocation fraîche sans collision.
    if (chainDelayMs !== null) {
      log(jobId, `auto-relance dans ${chainDelayMs}ms (origin=${originUrl ?? "?"})`);
      await fireSelfChain(originUrl, jobId, chainDelayMs);
    }
  }
}

export async function resumeBatchJobWithToken(jobId: string, accessToken: string) {
  const job = await readBatchJob(jobId);
  if (!job) return null;
  if (job.status !== "needs_token") return job;
  const next: OcrBatchJob = {
    ...job,
    accessToken,
    status: "processing",
    error: undefined,
    processingStartedAt: new Date().toISOString(),
    nextRunAt: undefined,
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

/** Arrête un lot OCR serveur en cours (fichiers déjà traités conservés dans les résultats). */
export async function cancelBatchJob(jobId: string): Promise<OcrBatchJob | null> {
  const job = await readBatchJob(jobId);
  if (!job) return null;
  if (job.status === "completed" || job.status === "failed") return job;

  const cancelled: OcrBatchJob = {
    ...job,
    status: "failed",
    error: "Traitement annulé par l'utilisateur.",
    label: "Traitement annulé",
    updatedAt: new Date().toISOString(),
  };
  await writeBatchJob(cancelled);
  await releaseRunLock(jobId);
  return cancelled;
}

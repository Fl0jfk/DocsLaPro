import type { OcrBatchJob, OcrBatchJobItem } from "@/app/api/agentIAOCR/batch-job/batch-job";

export type OcrBatchProgressPhase =
  | "pending"
  | "ocr"
  | "segmenting"
  | "segments"
  | "analyze"
  | "done"
  | "idle";

export type OcrBatchProgressView = {
  percent: number;
  label: string;
  phase: OcrBatchProgressPhase;
  phaseLabel: string;
  fileName: string | null;
  fileIndex: number;
  fileTotal: number;
  pageCount: number | null;
  segmentIndex: number | null;
  segmentTotal: number | null;
  documentsProcessed: number;
  documentsSucceeded: number;
  documentsFailed: number;
  updatedAt: string;
  idleSeconds: number;
};

function itemWeight(item: OcrBatchJobItem): number {
  if (item.segments && item.segments.length > 0) return item.segments.length;
  if (item.mode === "class" && item.pageCount && item.pageCount > 1) {
    return Math.max(Math.ceil(item.pageCount / 2), 6);
  }
  return 1;
}

function itemCompletedWeight(item: OcrBatchJobItem): number {
  const w = itemWeight(item);
  if (item.status === "done" || item.status === "failed") return w;
  if (item.phase === "segments" && item.segments?.length) {
    return Math.min(item.segmentIndex ?? 0, item.segments.length);
  }
  if (item.phase === "segmenting") return w * 0.65;
  if (item.phase === "analyze") return w * 0.9;
  if (item.phase === "ocr_poll") return w * 0.35;
  if (item.phase === "ocr_start") return w * 0.08;
  return 0;
}

function resolveUiPhase(item: OcrBatchJobItem | null): OcrBatchProgressPhase {
  if (!item) return "idle";
  if (item.status === "done" || item.status === "failed") return "done";
  const phase = item.phase ?? "ocr_start";
  if (phase === "ocr_start" || phase === "ocr_poll") return "ocr";
  if (phase === "segmenting") return "segmenting";
  if (phase === "segments") return "segments";
  if (phase === "analyze") return "analyze";
  return "pending";
}

const PHASE_LABELS: Record<OcrBatchProgressPhase, string> = {
  pending: "En attente",
  ocr: "Lecture OCR (Textract)",
  segmenting: "Découpage du PDF",
  segments: "Classement des morceaux",
  analyze: "Classement",
  done: "Terminé",
  idle: "—",
};

function buildLabel(job: OcrBatchJob, item: OcrBatchJobItem | null, phase: OcrBatchProgressPhase): string {
  if (!item) {
    if (job.status === "completed") {
      return `Terminé — ${job.results.length} document${job.results.length > 1 ? "s" : ""} traité${job.results.length > 1 ? "s" : ""}`;
    }
    return job.label || "Traitement en cours…";
  }

  const name = item.fileName;
  const pages = item.pageCount;

  if (phase === "ocr") {
    return pages
      ? `Lecture OCR — ${name} (${pages} page${pages > 1 ? "s" : ""}, Textract peut prendre plusieurs minutes)`
      : `Lecture OCR — ${name} (Textract en cours, gros PDF = plusieurs minutes)`;
  }

  if (phase === "segmenting") {
    return pages
      ? `Découpage IA — ${name} : analyse de ${pages} pages pour repérer chaque bulletin…`
      : `Découpage IA — ${name} : repérage des documents dans le PDF…`;
  }

  if (phase === "segments" && item.segments?.length) {
    const total = item.segments.length;
    const current = Math.min((item.segmentIndex ?? 0) + 1, total);
    const seg = item.segments[item.segmentIndex ?? 0];
    const pageHint = seg ? ` (pages ${seg.pageStart}–${seg.pageEnd})` : "";
    return `Classement ${current}/${total} — ${name}${pageHint}`;
  }

  if (phase === "analyze") {
    return `Classement — ${name}`;
  }

  return job.label || `Traitement — ${name}`;
}

/** Progression fine (segments, pages OCR) pour l'UI et l'API status. */
export function buildBatchProgressView(job: OcrBatchJob): OcrBatchProgressView {
  const fileTotal = job.items.length;
  const fileIndex = Math.min(job.currentItemIndex + 1, Math.max(fileTotal, 1));
  const currentItem = job.items[job.currentItemIndex] ?? null;

  let totalWeight = 0;
  let doneWeight = 0;
  for (let i = 0; i < job.items.length; i++) {
    const item = job.items[i]!;
    const w = itemWeight(item);
    totalWeight += w;
    if (i < job.currentItemIndex) {
      doneWeight += w;
    } else if (i === job.currentItemIndex) {
      doneWeight += itemCompletedWeight(item);
    }
  }

  const percent =
    job.status === "completed"
      ? 100
      : totalWeight > 0
        ? Math.min(99, Math.round((doneWeight / totalWeight) * 100))
        : job.percent;

  const phase = job.status === "completed" ? "done" : resolveUiPhase(currentItem);
  const label = buildLabel(job, currentItem, phase);
  const updatedAt = job.updatedAt || job.startedAt;
  const idleSeconds = Math.max(0, Math.round((Date.now() - new Date(updatedAt).getTime()) / 1000));

  return {
    percent,
    label,
    phase,
    phaseLabel: PHASE_LABELS[phase],
    fileName: currentItem?.fileName ?? null,
    fileIndex: fileTotal > 0 ? fileIndex : 0,
    fileTotal,
    pageCount: currentItem?.pageCount ?? null,
    segmentIndex:
      currentItem?.phase === "segments" && currentItem.segments?.length
        ? Math.min((currentItem.segmentIndex ?? 0) + 1, currentItem.segments.length)
        : null,
    segmentTotal: currentItem?.segments?.length ?? null,
    documentsProcessed: job.results.length,
    documentsSucceeded: job.results.filter((r) => r.success).length,
    documentsFailed: job.results.filter((r) => !r.success).length,
    updatedAt,
    idleSeconds,
  };
}

export function computeProgress(job: OcrBatchJob) {
  const view = buildBatchProgressView(job);
  return {
    percent: view.percent,
    completed: view.documentsSucceeded,
    failed: view.documentsFailed,
  };
}

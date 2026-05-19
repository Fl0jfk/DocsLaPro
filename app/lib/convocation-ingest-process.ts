import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  DetectDocumentTextCommand,
  GetDocumentTextDetectionCommand,
  StartDocumentTextDetectionCommand,
  TextractClient,
} from "@aws-sdk/client-textract";
import {
  readIngestJob,
  writeIngestJob,
  type IngestJob,
  type IngestJobCreated,
  type IngestJobPhase,
} from "@/app/api/convocations/ingest/ingest-job";

const INDEX_KEY = "convocations/index.json";
const SYNC_OCR_MAX_BYTES = 5 * 1024 * 1024;
const ASYNC_POLL_MS_FIRST = 1500;
const ASYNC_POLL_MS_MAX = 4000;
const ASYNC_MAX_WAIT_MS = 7 * 60 * 1000;
const MISTRAL_TIMEOUT_MS = 120_000;
const MISTRAL_OCR_SLICE = 16_000;

type Etablissement = "École" | "Collège" | "Lycée";
type ParsedSlot = { startAt: string; endAt: string };
type ParsedConvocation = {
  teacherName: string;
  examType: string;
  etablissement: Etablissement;
  sourceDocument: string;
  documentKey: string;
  confidence: number;
  slots: ParsedSlot[];
};

type ConvocationRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  data: {
    etablissement: Etablissement;
    startDate: string;
    endDate: string;
    teacherName: string;
    examType: string;
    startAt: string;
    endAt: string;
    sourceDocument: string;
    documentKey: string;
    documentKeys?: string[];
    confidence: number;
  };
};

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const textract = new TextractClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, " ")
    .trim();

export function mapIngestFailureMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || "");
  const msg = raw.toLowerCase();

  if (msg.includes("textract") && (msg.includes("timeout") || msg.includes("délai"))) {
    return {
      code: "OCR_TIMEOUT",
      error: "Lecture du PDF trop longue (OCR). Réessayez ou utilisez un PDF plus léger.",
    };
  }
  if (msg.includes("textract") || msg.includes("texte vide")) {
    return {
      code: "OCR_FAILED",
      error: "Impossible de lire le texte du PDF (scan flou, image ou fichier protégé).",
    };
  }
  if (msg.includes("mistral") || msg.includes("json introuvable") || msg.includes("abort")) {
    return {
      code: "AI_FAILED",
      error: "Analyse IA impossible sur ce document. Réessayez ou complétez en saisie manuelle.",
    };
  }
  if (msg.includes("credentials") || msg.includes("access denied") || msg.includes("bucket")) {
    return {
      code: "STORAGE_FAILED",
      error: "Erreur de stockage du fichier. Contactez l'administrateur si le problème persiste.",
    };
  }
  if (msg.includes("mistral_api_key") || msg.includes("api key")) {
    return {
      code: "AI_CONFIG",
      error: "Service IA non configuré (clé API manquante).",
    };
  }

  return {
    code: "INGEST_FAILED",
    error: "Erreur technique pendant l'import. Réessayez dans quelques instants.",
    detail: raw.slice(0, 280),
  };
}

async function patchJob(jobId: string, patch: Partial<IngestJob>) {
  const job = await readIngestJob(jobId);
  if (!job) return;
  await writeIngestJob({ ...job, ...patch });
}

async function getAbsenceIndex(): Promise<ConvocationRecord[]> {
  try {
    const result = await s3Client.send(
      new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: INDEX_KEY }),
    );
    const body = await result.Body?.transformToString();
    return body ? (JSON.parse(body) as ConvocationRecord[]) : [];
  } catch (error: unknown) {
    const e = error as { name?: string };
    if (e?.name === "NoSuchKey") return [];
    throw error;
  }
}

async function saveAbsenceIndex(index: ConvocationRecord[]) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: INDEX_KEY,
      Body: JSON.stringify(index),
      ContentType: "application/json",
    }),
  );
}

function blocksToText(blocks: { Text?: string | null; BlockType?: string }[]) {
  return blocks
    .filter((b) => b.BlockType === "LINE" && b.Text)
    .map((b) => b.Text)
    .join(" ");
}

async function ocrPdfBytesSync(pdfBytes: Uint8Array): Promise<string> {
  const res = await textract.send(new DetectDocumentTextCommand({ Document: { Bytes: pdfBytes } }));
  const text = blocksToText(res.Blocks || []);
  if (!text.trim()) throw new Error("Textract: texte vide.");
  return text;
}

async function collectTextractBlocks(jobId: string) {
  const blocks: NonNullable<
    Awaited<ReturnType<typeof textract.send<GetDocumentTextDetectionCommand>>>["Blocks"]
  > = [];
  let nextToken: string | undefined;
  do {
    const page = await textract.send(
      new GetDocumentTextDetectionCommand({ JobId: jobId, NextToken: nextToken }),
    );
    if (page.Blocks?.length) blocks.push(...page.Blocks);
    nextToken = page.NextToken;
  } while (nextToken);
  return blocks;
}

async function ocrS3KeyAsync(key: string): Promise<string> {
  const start = await textract.send(
    new StartDocumentTextDetectionCommand({
      DocumentLocation: { S3Object: { Bucket: process.env.BUCKET_NAME!, Name: key } },
    }),
  );
  const jobId = start.JobId;
  if (!jobId) throw new Error("Textract: Job ID manquant.");

  const deadline = Date.now() + ASYNC_MAX_WAIT_MS;
  let waitMs = ASYNC_POLL_MS_FIRST;
  while (Date.now() < deadline) {
    const result = await textract.send(new GetDocumentTextDetectionCommand({ JobId: jobId }));
    if (result.JobStatus === "SUCCEEDED") {
      const blocks = await collectTextractBlocks(jobId);
      const text = blocks
        .map((b) => b.Text)
        .filter(Boolean)
        .join(" ");
      if (!text) throw new Error("Textract: texte vide.");
      return text;
    }
    if (result.JobStatus === "FAILED" || result.JobStatus === "PARTIAL_SUCCESS") {
      throw new Error(`Textract: statut ${result.JobStatus}`);
    }
    await sleep(waitMs);
    waitMs = Math.min(waitMs + 500, ASYNC_POLL_MS_MAX);
  }
  throw new Error("Textract: timeout d'extraction.");
}

async function downloadS3Pdf(key: string): Promise<Uint8Array> {
  const res = await s3Client.send(
    new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: key }),
  );
  const bytes = await res.Body?.transformToByteArray();
  if (!bytes?.length) throw new Error("Textract: PDF introuvable sur S3.");
  return bytes;
}

/** OCR rapide (sync) pour petits PDF, sinon file d'attente Textract async + 1 retry. */
async function runTextractForS3Key(key: string): Promise<string> {
  const bytes = await downloadS3Pdf(key);
  if (bytes.length <= SYNC_OCR_MAX_BYTES) {
    try {
      return await ocrPdfBytesSync(bytes);
    } catch (e) {
      console.warn("[convocation-ingest] OCR sync échoué, repli async:", e);
    }
  }
  try {
    return await ocrS3KeyAsync(key);
  } catch (first) {
    console.warn("[convocation-ingest] OCR async 1ère tentative:", first);
    await sleep(2000);
    return await ocrS3KeyAsync(key);
  }
}

function parseJsonFromMistral(content: string) {
  const raw = String(content || "")
    .trim()
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Mistral: JSON introuvable.");
  return JSON.parse(raw.slice(start, end + 1));
}

function normalizeEtablissement(value: string): Etablissement {
  const n = norm(value);
  if (n.includes("ecole")) return "École";
  if (n.includes("lycee")) return "Lycée";
  return "Collège";
}

function toIso(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function readSlotBoundary(slot: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const raw = slot[key];
    if (raw === undefined || raw === null) continue;
    const value = String(raw).trim();
    if (value) return value;
  }
  return "";
}

function normalizeParsedSlots(raw: unknown): ParsedSlot[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedSlot[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const slot = item as Record<string, unknown>;
    const startAt = readSlotBoundary(slot, ["startAt", "start", "debut", "début", "dateDebut", "date_debut"]);
    const endAt = readSlotBoundary(slot, ["endAt", "end", "fin", "dateFin", "date_fin"]);
    if (!startAt || !endAt) continue;
    const startIso = toIso(startAt);
    const endIso = toIso(endAt);
    if (!startIso || !endIso) continue;
    if (new Date(endIso) <= new Date(startIso)) continue;
    out.push({ startAt: startIso, endAt: endIso });
  }
  return out;
}

function dedupeSlots(slots: ParsedSlot[]) {
  const seen = new Set<string>();
  const out: ParsedSlot[] = [];
  for (const slot of slots) {
    const key = `${slot.startAt}|${slot.endAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(slot);
  }
  return out.sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
}

function mergeContiguousSlots(slots: ParsedSlot[]) {
  if (slots.length <= 1) return slots;
  const GAP_MS = 5 * 60 * 1000;
  const sorted = dedupeSlots(slots);
  const merged: ParsedSlot[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i += 1) {
    const next = sorted[i];
    const currentEnd = +new Date(current.endAt);
    const nextStart = +new Date(next.startAt);
    const nextEnd = +new Date(next.endAt);

    if (nextStart <= currentEnd + GAP_MS) {
      if (nextEnd > currentEnd) current.endAt = next.endAt;
      continue;
    }

    merged.push(current);
    current = { ...next };
  }

  merged.push(current);
  return merged;
}

function buildAbsenceRecord(params: {
  etablissement: Etablissement;
  examType: string;
  teacherName: string;
  sourceDocument: string;
  documentKey: string;
  confidence: number;
  slot: ParsedSlot;
}) {
  const now = new Date().toISOString();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const record: ConvocationRecord = {
    id,
    createdAt: now,
    updatedAt: now,
    data: {
      etablissement: params.etablissement,
      startDate: params.slot.startAt.slice(0, 10),
      endDate: params.slot.endAt.slice(0, 10),
      teacherName: params.teacherName,
      examType: params.examType,
      startAt: params.slot.startAt,
      endAt: params.slot.endAt,
      sourceDocument: params.sourceDocument,
      documentKey: params.documentKey,
      documentKeys: params.documentKey ? [params.documentKey] : [],
      confidence: params.confidence,
    },
  };
  return record;
}

async function parseConvocationWithMistral(text: string, sourceDocument: string): Promise<ParsedConvocation> {
  const ocrSlice = text.slice(0, MISTRAL_OCR_SLICE);
  const prompt = `
Tu analyses une convocation d'examen (ou document assimilé) pour un professeur convoqué.
Réponds strictement en JSON valide, sans texte avant ni après.

RÈGLE 1 — CRÉNEAUX QUI S'ENCHAÎNENT (POURSUITE, MÊME JOURNÉE):
Si le document enchaîne deux missions sans trou (fin d'une = début de l'autre, ex. 17h30 puis 17h30),
ou décrit une poursuite ("puis", "jusqu'au", "à la décoration de copies", dépouillement, surveillance en continu),
c'est UNE SEULE indisponibilité continue → UN SEUL slot du début du premier au fin du dernier.

RÈGLE 2 — PLUSIEURS ABSENCES NON LIÉES:
Périodes séparées sans enchaînement → un slot par période distincte.

Tu dois parcourir TOUT le texte OCR (toutes les pages).
Si seule la date est indiquée sans heure, utiliser 08:00–18:00 (Europe/Paris).

Format JSON:
{
  "teacherName": "Prénom NOM",
  "examType": "brevet|bac|oral|convocation…",
  "etablissement": "École|Collège|Lycée",
  "sourceDocument": "${sourceDocument}",
  "confidence": 0.0,
  "slots": [{ "startAt": "ISO8601", "endAt": "ISO8601" }]
}

Texte OCR:
---
${ocrSlice}
---
`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MISTRAL_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Mistral: ${err}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content || "";
    const json = parseJsonFromMistral(content) as ParsedConvocation & { slots?: unknown };
    return {
      teacherName: String(json?.teacherName || "").trim(),
      examType: String(json?.examType || "Examen").trim(),
      etablissement: normalizeEtablissement(String(json?.etablissement || "")),
      sourceDocument,
      documentKey: "",
      confidence: Number(json?.confidence || 0),
      slots: normalizeParsedSlots(json?.slots),
    };
  } finally {
    clearTimeout(timer);
  }
}

const PROCESSING_ACTIVE_MS = 90 * 1000;

/** Évite deux exécutions parallèles ; relance si un traitement semble bloqué (Lambda coupée). */
export async function tryClaimIngestJob(jobId: string): Promise<boolean> {
  const job = await readIngestJob(jobId);
  if (!job) return false;
  if (job.status === "completed" || job.status === "failed") return false;

  if (job.status === "processing" && job.processingStartedAt) {
    const age = Date.now() - new Date(job.processingStartedAt).getTime();
    if (age < PROCESSING_ACTIVE_MS) return false;
    console.warn("[convocation-ingest] reprise job stale", jobId, age);
  }

  if (job.status !== "pending" && job.status !== "processing") return false;

  await writeIngestJob({
    ...job,
    status: "processing",
    processingStartedAt: new Date().toISOString(),
    phase: "ocr",
  });
  return true;
}

export async function runConvocationIngestJob(jobId: string, documentKey: string, sourceFileName: string) {
  let existing = await readIngestJob(jobId);
  if (!existing) return;
  if (existing.status === "completed" || existing.status === "failed") return;

  const fail = async (error: string, code: string, parsed?: Record<string, unknown>) => {
    const j = await readIngestJob(jobId);
    if (!j || j.status === "completed") return;
    await writeIngestJob({
      ...j,
      status: "failed",
      error,
      code,
      parsed: parsed ?? j.parsed,
      phase: undefined,
    });
  };

  const setPhase = async (phase: IngestJobPhase) => {
    await patchJob(jobId, { phase });
  };

  try {
    await setPhase("ocr");
    const ocrText = await runTextractForS3Key(documentKey);

    await setPhase("ai");
    const parsed = await parseConvocationWithMistral(ocrText, sourceFileName);
    parsed.documentKey = documentKey;

    if (!parsed.teacherName || parsed.slots.length === 0) {
      const hints: string[] = [];
      if (!parsed.teacherName) hints.push("nom du professeur non reconnu");
      if (parsed.slots.length === 0) hints.push("dates/heures non détectées");
      await fail(
        `Extraction incomplète (${hints.join(", ") || "données manquantes"}). Vérifiez la qualité du scan ou saisissez l'absence à la main.`,
        "EXTRACTION_INCOMPLETE",
        parsed as unknown as Record<string, unknown>,
      );
      return;
    }

    const normalizedSlots = mergeContiguousSlots(parsed.slots);
    if (normalizedSlots.length === 0) {
      await fail(
        "Les dates extraites sont invalides (format ou ordre incohérent). Essayez une saisie manuelle.",
        "INVALID_SLOTS",
        parsed as unknown as Record<string, unknown>,
      );
      return;
    }

    existing = await readIngestJob(jobId);
    if (existing?.status === "completed") return;

    await setPhase("saving");
    const currentIndex = await getAbsenceIndex();
    const createdRecords: ConvocationRecord[] = [];
    for (const slot of normalizedSlots) {
      const record = buildAbsenceRecord({
        etablissement: parsed.etablissement,
        examType: parsed.examType,
        teacherName: parsed.teacherName,
        sourceDocument: parsed.sourceDocument,
        documentKey: parsed.documentKey,
        confidence: parsed.confidence,
        slot,
      });
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.BUCKET_NAME!,
          Key: `convocations/${record.id}.json`,
          Body: JSON.stringify(record),
          ContentType: "application/json",
        }),
      );
      createdRecords.push(record);
    }
    await saveAbsenceIndex([...currentIndex, ...createdRecords]);

    const created: IngestJobCreated[] = createdRecords.map((r) => ({
      id: r.id,
      teacherName: r.data.teacherName,
      startDate: r.data.startDate,
      endDate: r.data.endDate,
    }));

    await writeIngestJob({
      ...(await readIngestJob(jobId))!,
      status: "completed",
      created,
      parsed: parsed as unknown as Record<string, unknown>,
      error: undefined,
      code: undefined,
      phase: undefined,
    });
  } catch (error) {
    console.error("[convocation-ingest] job:", error);
    const mapped = mapIngestFailureMessage(error);
    await fail(mapped.error, mapped.code || "INGEST_FAILED");
  }
}

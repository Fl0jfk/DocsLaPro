import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type IngestJobStatus = "pending" | "processing" | "completed" | "failed";
export type IngestJobPhase = "ocr" | "ai" | "saving";

export type IngestJobCreated = {
  id: string;
  teacherName: string;
  startDate: string;
  endDate: string;
};

export type IngestJob = {
  jobId: string;
  userId: string;
  status: IngestJobStatus;
  startedAt: string;
  updatedAt: string;
  sourceFileName: string;
  documentKey: string;
  processingStartedAt?: string;
  phase?: IngestJobPhase;
  error?: string;
  code?: string;
  created?: IngestJobCreated[];
  parsed?: Record<string, unknown>;
};

const JOB_PREFIX = "convocations/ingest-jobs/";

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, " ")
    .trim();

export function canIngestFromUser(roles: string[]) {
  const normalized = roles.map((r) => norm(r));
  return normalized.some((r) =>
    ["administratif", "direction ecole", "direction college", "direction lycee", "education"].some((allowed) =>
      r.includes(allowed),
    ),
  );
}

function jobKey(jobId: string) {
  return `${JOB_PREFIX}${jobId}.json`;
}

export async function readIngestJob(jobId: string): Promise<IngestJob | null> {
  try {
    const res = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: jobKey(jobId),
      }),
    );
    const raw = await res.Body?.transformToString();
    if (!raw) return null;
    return JSON.parse(raw) as IngestJob;
  } catch {
    return null;
  }
}

export async function writeIngestJob(job: IngestJob) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: jobKey(job.jobId),
      Body: JSON.stringify({ ...job, updatedAt: new Date().toISOString() }),
      ContentType: "application/json",
    }),
  );
}

export function newJobId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

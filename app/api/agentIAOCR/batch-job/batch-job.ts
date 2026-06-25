import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getBucketName } from "@/app/lib/s3-storage";

export type OcrBatchJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "needs_token";

export type OcrBatchItemMode = "standard" | "class";

export type OcrBatchResult = {
  success: boolean;
  fileName: string;
  error?: string;
  tempOneDrivePath?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
};

export type OcrBatchJobItem = {
  id: string;
  fileName: string;
  mode: OcrBatchItemMode;
  s3Key: string;
  tempPath: string;
  status: "pending" | "processing" | "done" | "failed";
};

export type OcrBatchJob = {
  jobId: string;
  userId: string;
  status: OcrBatchJobStatus;
  startedAt: string;
  updatedAt: string;
  processingStartedAt?: string;
  accessToken: string;
  items: OcrBatchJobItem[];
  currentItemIndex: number;
  results: OcrBatchResult[];
  label: string;
  percent: number;
  completed: number;
  failed: number;
  error?: string;
};

const JOB_PREFIX = "agentIAOCR/batch-jobs/";
const INDEX_PREFIX = "agentIAOCR/batch-jobs-index/";

function jobKey(jobId: string) {
  return `${JOB_PREFIX}${jobId}.json`;
}

function indexKey(userId: string) {
  return `${INDEX_PREFIX}${userId}.json`;
}

export function newBatchJobId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function readBatchJob(jobId: string): Promise<OcrBatchJob | null> {
  const s3Client = await getTenantDataS3Client();
  try {
    const res = await s3Client.send(
      new GetObjectCommand({
        Bucket: await getBucketName(),
        Key: jobKey(jobId),
      }),
    );
    const raw = await res.Body?.transformToString();
    if (!raw) return null;
    return JSON.parse(raw) as OcrBatchJob;
  } catch {
    return null;
  }
}

export async function writeBatchJob(job: OcrBatchJob) {
  const s3Client = await getTenantDataS3Client();
  await s3Client.send(
    new PutObjectCommand({
      Bucket: await getBucketName(),
      Key: jobKey(job.jobId),
      Body: JSON.stringify({ ...job, updatedAt: new Date().toISOString() }),
      ContentType: "application/json",
    }),
  );
}

type UserJobIndex = { jobIds: string[]; updatedAt: string };

async function readUserJobIndex(userId: string): Promise<UserJobIndex> {
  const s3Client = await getTenantDataS3Client();
  try {
    const res = await s3Client.send(
      new GetObjectCommand({
        Bucket: await getBucketName(),
        Key: indexKey(userId),
      }),
    );
    const raw = await res.Body?.transformToString();
    if (!raw) return { jobIds: [], updatedAt: new Date().toISOString() };
    const parsed = JSON.parse(raw) as UserJobIndex;
    return { jobIds: Array.isArray(parsed.jobIds) ? parsed.jobIds : [], updatedAt: parsed.updatedAt };
  } catch {
    return { jobIds: [], updatedAt: new Date().toISOString() };
  }
}

async function writeUserJobIndex(userId: string, index: UserJobIndex) {
  const s3Client = await getTenantDataS3Client();
  await s3Client.send(
    new PutObjectCommand({
      Bucket: await getBucketName(),
      Key: indexKey(userId),
      Body: JSON.stringify({ ...index, updatedAt: new Date().toISOString() }),
      ContentType: "application/json",
    }),
  );
}

export async function registerBatchJobForUser(userId: string, jobId: string) {
  const index = await readUserJobIndex(userId);
  const jobIds = [jobId, ...index.jobIds.filter((id) => id !== jobId)].slice(0, 20);
  await writeUserJobIndex(userId, { jobIds, updatedAt: new Date().toISOString() });
}

export async function listRecentBatchJobsForUser(userId: string, limit = 5): Promise<OcrBatchJob[]> {
  const index = await readUserJobIndex(userId);
  const jobs: OcrBatchJob[] = [];
  for (const jobId of index.jobIds.slice(0, limit)) {
    const job = await readBatchJob(jobId);
    if (job && job.userId === userId) jobs.push(job);
  }
  return jobs;
}

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type KnowledgeDomain = {
  id: string;
  label: string;
  file: string;
  isYearlyReset: boolean;
  keywords: string[];
};

type KnowledgeIndex = {
  version: number;
  updatedAt: string;
  domains: KnowledgeDomain[];
};

type KnowledgeEntry = {
  id: string;
  title: string;
  content: string;
  source: string;
  audiences?: Array<"public" | "private">;
};

export type KnowledgeDocument = {
  domainId: string;
  schoolYear?: string;
  updatedAt: string;
  entries: KnowledgeEntry[];
};

function getS3Client() {
  return new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID || "",
      secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
    },
  });
}

function getKnowledgeBucket() {
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) throw new Error("BUCKET_NAME manquant");
  return bucket;
}

function knowledgeKey(file: string) {
  const prefix = (process.env.KNOWLEDGE_PREFIX || "knowledge").replace(/^\/+|\/+$/g, "");
  return `${prefix}/${file}`;
}

async function readKnowledgeJsonFromS3<T>(file: string): Promise<T> {
  const s3 = getS3Client();
  const bucket = getKnowledgeBucket();
  const key = knowledgeKey(file);
  const signed = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 120 }
  );
  const res = await fetch(signed, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Lecture knowledge S3 impossible (${res.status}) pour ${key}`);
  }
  return (await res.json()) as T;
}

async function writeKnowledgeJsonToS3(file: string, data: unknown) {
  const s3 = getS3Client();
  const bucket = getKnowledgeBucket();
  const key = knowledgeKey(file);
  const signed = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: "application/json; charset=utf-8",
    }),
    { expiresIn: 120 }
  );
  const payload = JSON.stringify(data, null, 2);
  const res = await fetch(signed, {
    method: "PUT",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: payload,
  });
  if (!res.ok) {
    throw new Error(`Ecriture knowledge S3 impossible (${res.status})`);
  }
}

export async function readKnowledgeIndex(): Promise<KnowledgeIndex> {
  return readKnowledgeJsonFromS3<KnowledgeIndex>("index.json");
}

export async function readKnowledgeDocument(file: string): Promise<KnowledgeDocument> {
  return readKnowledgeJsonFromS3<KnowledgeDocument>(file);
}

export function selectDomainByMessage(domains: KnowledgeDomain[], message: string): KnowledgeDomain {
  const text = message.toLowerCase();
  let best = domains[0];
  let bestScore = -1;
  for (const domain of domains) {
    const score = domain.keywords.reduce((acc, keyword) => (text.includes(keyword.toLowerCase()) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      best = domain;
    }
  }
  return best;
}

export function buildContextFromEntries(doc: KnowledgeDocument, audience: "public" | "private", maxEntries = 8): string {
  const rows = doc.entries
    .filter((entry) => !entry.audiences || entry.audiences.includes(audience))
    .slice(0, maxEntries)
    .map((entry) => `- [${entry.title}] ${entry.content} (source: ${entry.source})`);
  return rows.join("\n");
}

export async function appendEntryToKnowledgeFile(
  file: string,
  entry: { title: string; content: string; source: string; audiences?: Array<"public" | "private"> }
) {
  const doc = await readKnowledgeDocument(file);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  doc.entries.unshift({
    id,
    title: entry.title,
    content: entry.content,
    source: entry.source,
    audiences: entry.audiences ?? ["public", "private"],
  });
  doc.updatedAt = new Date().toISOString().slice(0, 10);
  await writeKnowledgeJsonToS3(file, doc);
}

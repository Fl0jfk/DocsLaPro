import "server-only";

import {
  GetDocumentTextDetectionCommand,
  StartDocumentTextDetectionCommand,
  TextractClient,
  type Block,
} from "@aws-sdk/client-textract";
import { getBucketName } from "@/app/lib/s3-storage";

const textract = new TextractClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function blocksToPageTexts(blocks: Block[]): Record<string, string> {
  const linesByPage: Record<number, string[]> = {};

  for (const b of blocks) {
    if (!b.Text || !b.Page) continue;
    if (b.BlockType !== "LINE" && b.BlockType !== "WORD") continue;
    const page = b.Page;
    if (!linesByPage[page]) linesByPage[page] = [];
    if (b.BlockType === "LINE") linesByPage[page].push(b.Text);
  }

  if (Object.keys(linesByPage).length === 0) {
    for (const b of blocks) {
      if (b.Text && b.Page) {
        const page = b.Page;
        if (!linesByPage[page]) linesByPage[page] = [];
        linesByPage[page].push(b.Text);
      }
    }
  }

  const pageTexts: Record<string, string> = {};
  const pages = Object.keys(linesByPage)
    .map(Number)
    .sort((a, b) => a - b);
  for (const p of pages) {
    pageTexts[String(p)] = linesByPage[p].join(" ");
  }
  return pageTexts;
}

function countDistinctPagesInBlocks(blocks: Block[]): number {
  const pages = new Set<number>();
  for (const b of blocks) {
    if (b.Page && b.Page > 0) pages.add(b.Page);
  }
  return pages.size;
}

function maxPageInBlocks(blocks: Block[]): number {
  let max = 0;
  for (const b of blocks) {
    if (b.Page && b.Page > max) max = b.Page;
  }
  return max;
}

async function collectAllBlocks(jobId: string, initialBlocks: Block[], initialToken?: string): Promise<Block[]> {
  const blocks = [...initialBlocks];
  let nextToken = initialToken;
  while (nextToken) {
    const result = await textract.send(
      new GetDocumentTextDetectionCommand({ JobId: jobId, NextToken: nextToken }),
    );
    if (result.Blocks?.length) blocks.push(...result.Blocks);
    nextToken = result.NextToken;
  }
  return blocks;
}

async function pollTextractStatus(jobId: string): Promise<{
  status: string;
  blocks: Block[];
  pagesRead: number;
  maxPageSeen: number;
}> {
  const result = await textract.send(new GetDocumentTextDetectionCommand({ JobId: jobId }));
  const status = result.JobStatus ?? "IN_PROGRESS";
  const blocks = result.Blocks ?? [];

  if (status === "SUCCEEDED") {
    const allBlocks = await collectAllBlocks(jobId, blocks, result.NextToken);
    return {
      status,
      blocks: allBlocks,
      pagesRead: countDistinctPagesInBlocks(allBlocks),
      maxPageSeen: maxPageInBlocks(allBlocks),
    };
  }

  if (status === "FAILED") {
    return { status, blocks: [], pagesRead: 0, maxPageSeen: 0 };
  }

  return {
    status,
    blocks,
    pagesRead: countDistinctPagesInBlocks(blocks),
    maxPageSeen: maxPageInBlocks(blocks),
  };
}

export type OcrTextractResult = {
  text: string;
  pageTexts: Record<string, string>;
  pageCount: number;
};

function blocksToResult(blocks: Block[]): OcrTextractResult {
  const pageTexts = blocksToPageTexts(blocks);
  const pages = Object.keys(pageTexts)
    .map(Number)
    .sort((a, b) => a - b);
  const text = pages.map((p) => `--- Page ${p} ---\n${pageTexts[String(p)]}`).join("\n\n");
  return { text, pageTexts, pageCount: pages.length };
}

/** Démarre un job Textract asynchrone et renvoie son JobId (sans attendre la fin). */
export async function startTextractForS3Key(key: string): Promise<string> {
  const bucket = await getBucketName();
  const start = await textract.send(
    new StartDocumentTextDetectionCommand({
      DocumentLocation: { S3Object: { Bucket: bucket, Name: key } },
    }),
  );
  if (!start.JobId) throw new Error("Impossible de lancer Textract");
  return start.JobId;
}

export type TextractPollResult =
  | { status: "IN_PROGRESS"; pagesRead: number; maxPageSeen: number }
  | { status: "FAILED" }
  | { status: "SUCCEEDED"; result: OcrTextractResult; pagesRead: number };

/**
 * Un seul tour de polling Textract (non bloquant pour le budget serverless).
 * En IN_PROGRESS : pages lues d'après les blocs déjà publiés par Textract (peut rester à 0 longtemps).
 * En SUCCEEDED : pagination complète des blocs.
 */
export async function pollTextractOnce(jobId: string): Promise<TextractPollResult> {
  const { status, blocks, pagesRead, maxPageSeen } = await pollTextractStatus(jobId);
  if (status === "SUCCEEDED") {
    return { status: "SUCCEEDED", result: blocksToResult(blocks), pagesRead };
  }
  if (status === "FAILED") return { status: "FAILED" };
  return {
    status: "IN_PROGRESS",
    pagesRead: pagesRead || maxPageSeen,
    maxPageSeen,
  };
}

/** Variante bloquante historique (conservée pour compat ; le worker batch utilise les micro-étapes). */
export async function runTextractForS3Key(
  key: string,
  maxAttempts = 90,
): Promise<OcrTextractResult> {
  const jobId = await startTextractForS3Key(key);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const poll = await pollTextractOnce(jobId);
    if (poll.status === "SUCCEEDED") return poll.result;
    if (poll.status === "FAILED") throw new Error("OCR Textract échoué");
    const delay = attempt < 5 ? 1500 : attempt < 15 ? 2500 : 4000;
    await sleep(delay);
  }
  throw new Error("Timeout OCR Textract");
}

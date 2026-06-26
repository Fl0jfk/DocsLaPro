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

async function collectBlocks(jobId: string): Promise<{ status: string; blocks: Block[] }> {
  const blocks: Block[] = [];
  let nextToken: string | undefined;
  let jobStatus = "IN_PROGRESS";

  do {
    const result = await textract.send(
      new GetDocumentTextDetectionCommand({ JobId: jobId, NextToken: nextToken }),
    );
    jobStatus = result.JobStatus ?? jobStatus;
    if (result.JobStatus === "FAILED") return { status: "FAILED", blocks: [] };
    if (result.Blocks?.length) blocks.push(...result.Blocks);
    nextToken = result.NextToken;
    if (!nextToken && jobStatus !== "SUCCEEDED") return { status: jobStatus, blocks: [] };
  } while (nextToken);

  return { status: jobStatus, blocks };
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
  | { status: "IN_PROGRESS" }
  | { status: "FAILED" }
  | { status: "SUCCEEDED"; result: OcrTextractResult };

/**
 * Un seul tour de polling Textract (non bloquant pour le budget serverless).
 * Tant que le job est IN_PROGRESS, la requête revient immédiatement ;
 * la pagination complète des blocs n'a lieu qu'une fois SUCCEEDED.
 */
export async function pollTextractOnce(jobId: string): Promise<TextractPollResult> {
  const { status, blocks } = await collectBlocks(jobId);
  if (status === "SUCCEEDED") return { status: "SUCCEEDED", result: blocksToResult(blocks) };
  if (status === "FAILED") return { status: "FAILED" };
  return { status: "IN_PROGRESS" };
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

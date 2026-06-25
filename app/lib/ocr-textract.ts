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

export async function runTextractForS3Key(
  key: string,
  maxAttempts = 90,
): Promise<OcrTextractResult> {
  const bucket = await getBucketName();
  const start = await textract.send(
    new StartDocumentTextDetectionCommand({
      DocumentLocation: { S3Object: { Bucket: bucket, Name: key } },
    }),
  );
  const jobId = start.JobId;
  if (!jobId) throw new Error("Impossible de lancer Textract");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { status, blocks } = await collectBlocks(jobId);
    if (status === "SUCCEEDED") {
      const pageTexts = blocksToPageTexts(blocks);
      const pages = Object.keys(pageTexts)
        .map(Number)
        .sort((a, b) => a - b);
      const text = pages.map((p) => `--- Page ${p} ---\n${pageTexts[String(p)]}`).join("\n\n");
      return { text, pageTexts, pageCount: pages.length };
    }
    if (status === "FAILED") throw new Error("OCR Textract échoué");
    const delay = attempt < 5 ? 1500 : attempt < 15 ? 2500 : 4000;
    await sleep(delay);
  }
  throw new Error("Timeout OCR Textract");
}

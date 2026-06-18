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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function blocksToText(blocks: Block[]): string {
  const lines: string[] = [];
  for (const b of blocks) {
    if (b.BlockType === "LINE" && b.Text) lines.push(b.Text);
  }
  if (lines.length === 0) {
    for (const b of blocks) {
      if (b.Text) lines.push(b.Text);
    }
  }
  return lines.join("\n");
}

export async function extractPdfTextFromS3(s3Key: string, maxWaitMs = 90_000): Promise<string> {
  const bucket = await getBucketName();
  const start = await textract.send(
    new StartDocumentTextDetectionCommand({
      DocumentLocation: { S3Object: { Bucket: bucket, Name: s3Key } },
    }),
  );
  const jobId = start.JobId;
  if (!jobId) throw new Error("Impossible de démarrer l'analyse du PDF.");

  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const { status, blocks } = await collectBlocks(jobId);
    if (status === "SUCCEEDED") {
      const text = blocksToText(blocks).trim();
      if (!text) throw new Error("Aucun texte détecté dans le PDF.");
      return text;
    }
    if (status === "FAILED") throw new Error("L'analyse du PDF a échoué.");
    await sleep(1500);
  }
  throw new Error("Délai dépassé lors de la lecture du PDF.");
}

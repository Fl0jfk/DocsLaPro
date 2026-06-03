import { NextResponse } from 'next/server';
import {
  TextractClient,
  GetDocumentTextDetectionCommand,
  type Block,
} from '@aws-sdk/client-textract';
import { getAuth } from '@clerk/nextjs/server';

const textract = new TextractClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

async function collectBlocks(jobId: string): Promise<{ status: string; blocks: Block[] }> {
  const blocks: Block[] = [];
  let nextToken: string | undefined;
  let jobStatus = "IN_PROGRESS";

  do {
    const result = await textract.send(
      new GetDocumentTextDetectionCommand({ JobId: jobId, NextToken: nextToken })
    );
    jobStatus = result.JobStatus ?? jobStatus;
    if (result.JobStatus === "FAILED") {
      return { status: "FAILED", blocks: [] };
    }
    if (result.Blocks?.length) {
      blocks.push(...result.Blocks);
    }
    nextToken = result.NextToken;
    if (!nextToken && jobStatus !== "SUCCEEDED") {
      return { status: jobStatus, blocks: [] };
    }
  } while (nextToken);

  return { status: jobStatus, blocks };
}

function blocksToPageTexts(blocks: Block[]): Record<string, string> {
  const linesByPage: Record<number, string[]> = {};

  for (const b of blocks) {
    if (!b.Text || !b.Page) continue;
    if (b.BlockType !== "LINE" && b.BlockType !== "WORD") continue;
    const page = b.Page;
    if (!linesByPage[page]) linesByPage[page] = [];
    if (b.BlockType === "LINE") {
      linesByPage[page].push(b.Text);
    }
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

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const { jobId } = await req.json();
    if (!jobId) return NextResponse.json({ error: 'jobId requis' }, { status: 400 });

    const { status, blocks } = await collectBlocks(jobId);

    if (status === "SUCCEEDED") {
      const pageTexts = blocksToPageTexts(blocks);
      const pages = Object.keys(pageTexts)
        .map(Number)
        .sort((a, b) => a - b);
      const text = pages
        .map((p) => `--- Page ${p} ---\n${pageTexts[String(p)]}`)
        .join("\n\n");
      return NextResponse.json({
        text,
        pageTexts,
        pageCount: pages.length,
      });
    }

    if (status === "IN_PROGRESS" || status === "PARTIAL_SUCCESS") {
      return NextResponse.json({ status: "IN_PROGRESS" });
    }

    return NextResponse.json({ status, error: "OCR échoué ou annulé" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

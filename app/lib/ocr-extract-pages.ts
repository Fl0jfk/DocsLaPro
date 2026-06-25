import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { PDFDocument } from "pdf-lib";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getBucketName } from "@/app/lib/s3-storage";

export async function extractPdfPagesBytes(
  key: string,
  pageStart: number,
  pageEnd: number,
): Promise<Uint8Array> {
  const bucket = await getBucketName();
  const s3 = await getTenantDataS3Client();
  const start = Math.max(1, Number(pageStart) || 1);
  const end = Math.max(start, Number(pageEnd) || start);

  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = await obj.Body?.transformToByteArray();
  if (!bytes?.length) throw new Error("PDF introuvable sur S3");

  const src = await PDFDocument.load(bytes);
  const pageCount = src.getPageCount();
  const i0 = Math.min(start - 1, pageCount - 1);
  const i1 = Math.min(end - 1, pageCount - 1);
  const indices = [];
  for (let i = i0; i <= i1; i++) indices.push(i);

  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, indices);
  copied.forEach((p) => out.addPage(p));
  return out.save();
}

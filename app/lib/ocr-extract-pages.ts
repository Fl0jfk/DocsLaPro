import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { PDFDocument } from "pdf-lib";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getBucketName } from "@/app/lib/s3-storage";

/**
 * Cache du dernier PDF source chargé (clé S3 → document pdf-lib).
 * Le classement document par document extrait plusieurs segments du MÊME PDF :
 * sans ce cache, on re-télécharge et re-parse le PDF entier à chaque segment
 * (50 segments = 50 téléchargements complets). On garde uniquement le dernier
 * fichier pour ne pas gonfler la mémoire de la fonction serverless.
 */
let pdfCache: { key: string; doc: PDFDocument; pageCount: number } | null = null;

async function loadPdfDocument(key: string): Promise<{ doc: PDFDocument; pageCount: number }> {
  if (pdfCache && pdfCache.key === key) return { doc: pdfCache.doc, pageCount: pdfCache.pageCount };
  const bucket = await getBucketName();
  const s3 = await getTenantDataS3Client();
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = await obj.Body?.transformToByteArray();
  if (!bytes?.length) throw new Error("PDF introuvable sur S3");
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = doc.getPageCount();
  pdfCache = { key, doc, pageCount };
  return { doc, pageCount };
}

/** Nombre de pages du PDF sur S3 (métadonnées fichier, avant Textract). */
export async function getPdfPageCountFromS3(key: string): Promise<number> {
  const { pageCount } = await loadPdfDocument(key);
  return pageCount;
}

export async function extractPdfPagesBytes(
  key: string,
  pageStart: number,
  pageEnd: number,
): Promise<Uint8Array> {
  const start = Math.max(1, Number(pageStart) || 1);
  const end = Math.max(start, Number(pageEnd) || start);

  const { doc: src, pageCount } = await loadPdfDocument(key);
  const i0 = Math.min(start - 1, pageCount - 1);
  const i1 = Math.min(end - 1, pageCount - 1);
  const indices = [];
  for (let i = i0; i <= i1; i++) indices.push(i);

  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, indices);
  copied.forEach((p) => out.addPage(p));
  return out.save();
}

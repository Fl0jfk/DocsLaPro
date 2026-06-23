import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { DetectDocumentTextCommand, TextractClient } from "@aws-sdk/client-textract";
import { PDFDocument } from "pdf-lib";
import { resolveDirectionSignatureImageUrl } from "@/app/lib/stage-config";
import { loadReferentSignatureBytes, parsePngBase64 } from "@/app/lib/stage-signature-store";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getBucketName } from "@/app/lib/s3-storage";
import {
  textractSignatureBBoxToPdfLibDrawCoords,
  type SignatureFieldBBoxNormalized,
} from "@/app/lib/travel-devis-ocr";
import type { StageConvention, StageSignerRole } from "@/app/lib/stage-types";

const SIG_W = 140;
const SIG_H = 55;

const ROLE_LABEL_PATTERNS: Partial<Record<StageSignerRole, RegExp[]>> = {
  professeur_referent: [
    /professeur/i,
    /referent/i,
    /etablissement\s+d.?enseignement/i,
    /representant.*etablissement/i,
    /visa.*etablissement/i,
  ],
  direction: [
    /chef\s+d.?etablissement/i,
    /directeur/i,
    /\bdirection\b/i,
    /etablissement\s+scolaire/i,
    /cachet.*etablissement/i,
  ],
};

function textractClient() {
  return new TextractClient({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
}

function scoreLineForRole(text: string, patterns: RegExp[]): number {
  const t = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  let score = 0;
  for (const re of patterns) {
    if (re.test(t)) score += 8;
  }
  if (/signature/.test(t)) score += 4;
  return score;
}

async function findSignatureBBoxForRole(
  pdfBytes: Uint8Array,
  role: StageSignerRole,
): Promise<SignatureFieldBBoxNormalized | null> {
  const patterns = ROLE_LABEL_PATTERNS[role];
  if (!patterns?.length || !process.env.ACCESS_KEY_ID) return null;

  try {
    const client = textractClient();
    const res = await client.send(
      new DetectDocumentTextCommand({ Document: { Bytes: pdfBytes } }),
    );
    const blocks = res.Blocks || [];
    type Cand = { page: number; score: number; left: number; top: number; width: number; height: number };
    const cands: Cand[] = [];

    for (const b of blocks) {
      if (b.BlockType !== "LINE" || !b.Text?.trim()) continue;
      const score = scoreLineForRole(b.Text, patterns);
      if (score <= 0) continue;
      const bb = b.Geometry?.BoundingBox;
      if (bb?.Left == null || bb.Top == null || bb.Width == null || bb.Height == null) continue;
      cands.push({
        page: b.Page != null && b.Page > 0 ? b.Page : 1,
        score,
        left: bb.Left,
        top: bb.Top,
        width: bb.Width,
        height: bb.Height,
      });
    }

    if (!cands.length) return null;
    cands.sort((a, b) => b.score - a.score || b.page - a.page);
    const best = cands[0]!;
    return {
      pageNumber: best.page,
      left: best.left,
      top: best.top,
      width: best.width,
      height: best.height,
    };
  } catch (e) {
    console.error("[stage-pdf-sign] Textract:", e);
    return null;
  }
}

function fallbackCoords(pageWidth: number, role: StageSignerRole): { x: number; y: number } {
  if (role === "direction") {
    return { x: pageWidth - SIG_W - 48, y: 72 };
  }
  return { x: 48, y: 72 };
}

async function embedImageOnPdf(
  pdfBytes: Uint8Array,
  imageBytes: Uint8Array,
  role: StageSignerRole,
  isJpg: boolean,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const sigImage = isJpg ? await pdfDoc.embedJpg(imageBytes) : await pdfDoc.embedPng(imageBytes);
  const pages = pdfDoc.getPages();
  const bbox = await findSignatureBBoxForRole(pdfBytes, role);

  let targetPage = pages[pages.length - 1]!;
  let drawX: number;
  let drawY: number;

  if (bbox && pages.length > 0) {
    const pageIndex = Math.min(Math.max(1, bbox.pageNumber), pages.length) - 1;
    targetPage = pages[pageIndex]!;
    const { width: pw, height: ph } = targetPage.getSize();
    const coords = textractSignatureBBoxToPdfLibDrawCoords(pw, ph, bbox, SIG_W, SIG_H, 4);
    drawX = coords.x;
    drawY = coords.y;
  } else {
    const { width } = targetPage.getSize();
    const fb = fallbackCoords(width, role);
    drawX = fb.x;
    drawY = fb.y;
  }

  targetPage.drawImage(sigImage, { x: drawX, y: drawY, width: SIG_W, height: SIG_H });
  return pdfDoc.save();
}

async function loadConventionPdfBytes(convention: StageConvention): Promise<Uint8Array | null> {
  const key = convention.uploadedPdf?.s3Key;
  if (!key) return null;
  const s3Client = await getTenantDataS3Client();
  const obj = await s3Client.send(
    new GetObjectCommand({ Bucket: await getBucketName(), Key: key }),
  );
  const bytes = await obj.Body?.transformToByteArray();
  return bytes?.length ? bytes : null;
}

async function saveConventionPdfBytes(convention: StageConvention, pdfBytes: Uint8Array): Promise<void> {
  const key = convention.uploadedPdf?.s3Key;
  if (!key) throw new Error("PDF convention introuvable.");
  const s3Client = await getTenantDataS3Client();
  await s3Client.send(
    new PutObjectCommand({
      Bucket: await getBucketName(),
      Key: key,
      Body: pdfBytes,
      ContentType: "application/pdf",
    }),
  );
}

async function fetchImageFromUrl(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export function roleStampsPdf(role: StageSignerRole): boolean {
  return role === "professeur_referent" || role === "direction";
}

export async function resolveSignaturePngForRole(
  convention: StageConvention,
  role: StageSignerRole,
  drawnPngBase64?: string,
): Promise<Uint8Array | null> {
  const drawn = drawnPngBase64 ? parsePngBase64(drawnPngBase64) : null;
  if (drawn) return drawn;

  if (role === "direction") {
    const url = await resolveDirectionSignatureImageUrl(convention.student.level);
    if (!url) return null;
    return fetchImageFromUrl(url);
  }

  if (role === "professeur_referent") {
    const userId = convention.teacherReferent.userId;
    if (userId) return loadReferentSignatureBytes(userId);
  }

  return null;
}

/** Applique l'image de signature sur le PDF déposé (prof référent ou direction). */
export async function stampSignatureOnConventionPdf(params: {
  convention: StageConvention;
  role: StageSignerRole;
  drawnPngBase64?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!roleStampsPdf(params.role)) return { ok: true };

  const pdfBytes = await loadConventionPdfBytes(params.convention);
  if (!pdfBytes) {
    return { ok: false, error: "Aucun PDF déposé — signature enregistrée sans paraphe sur le document." };
  }

  const sigBytes = await resolveSignaturePngForRole(
    params.convention,
    params.role,
    params.drawnPngBase64,
  );

  if (!sigBytes && params.role === "direction") {
    return {
      ok: false,
      error:
        "Image de signature direction non configurée (Paramètres → Voyages → signatures ecole/college/lycee).",
    };
  }

  if (!sigBytes && params.role === "professeur_referent") {
    return {
      ok: false,
      error:
        "Dessinez votre signature ci-dessous ou enregistrez-la une fois dans Stages (connecté à l'intranet).",
    };
  }

  const isJpg = sigBytes![0] === 0xff && sigBytes![1] === 0xd8;
  const stamped = await embedImageOnPdf(pdfBytes, sigBytes!, params.role, isJpg);
  await saveConventionPdfBytes(params.convention, stamped);
  return { ok: true };
}

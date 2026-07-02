import "server-only";

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { loadAppConfig } from "@/app/lib/app-config";
import {
  drawPdfFooter,
  drawPdfLetterhead,
  fitImageInBox,
  getSchoolLetterhead,
  loadImageForPdfFromRef,
  loadSchoolLogoForPdf,
} from "@/app/lib/pdf-branding";
import { loadCertificateProfSignatureBytes } from "@/app/lib/certificates-signature-store";
import { shortContentHash } from "@/app/lib/certificates-verify";
import {
  CERTIFICATE_SECTEUR_LABELS,
  type StudentAward,
} from "@/app/lib/certificates-types";
import { resolveDirectionSignatureImageUrl } from "@/app/lib/stage-config";

const SLATE: [number, number, number] = [30, 41, 59];
const SLATE_BODY: [number, number, number] = [71, 85, 105];
const SLATE_LIGHT: [number, number, number] = [148, 163, 184];
const BORDER: [number, number, number] = [226, 232, 240];
const ACCENT: [number, number, number] = [79, 70, 229];
const FOOTER_H = 14;

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function loadProfSigDataUri(clerkUserId: string): Promise<string | null> {
  const bytes = await loadCertificateProfSignatureBytes(clerkUserId);
  if (!bytes?.length) return null;
  return `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
}

export async function generateCertificatePdf(
  award: StudentAward,
  verifyUrl: string,
): Promise<Uint8Array> {
  const [letterhead, logo] = await Promise.all([getSchoolLetterhead(), loadSchoolLogoForPdf()]);
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const ML = 22;
  const MR = W - 22;
  const contentW = MR - ML;

  drawPdfLetterhead(doc, letterhead, logo, ACCENT);
  let y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_LIGHT);
  doc.text("CERTIFICAT / PARCOURS", ML, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...ACCENT);
  const titleLines = doc.splitTextToSize(award.programTitle, contentW);
  doc.text(titleLines, ML, y);
  y += titleLines.length * 8 + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...SLATE);
  doc.text(
    `Décerné à ${award.student.prenom} ${award.student.nom.toUpperCase()} — ${award.student.classe || "—"}`,
    ML,
    y,
  );
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_BODY);
  doc.text(`Année scolaire ${award.schoolYear}`, ML, y);
  y += 12;

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(ML, y, MR, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  doc.text("Parcours et réalisations", ML, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_BODY);
  for (let i = 0; i < award.lines.length; i++) {
    const line = award.lines[i];
    const periodSuffix = line.period ? ` (${line.period})` : "";
    const heading = `${i + 1}. ${line.title}${periodSuffix}`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...SLATE);
    const headingWrapped = doc.splitTextToSize(heading, contentW - 6);
    if (y + headingWrapped.length * 5 + 12 > H - 80) {
      doc.addPage();
      y = 24;
    }
    doc.text(headingWrapped, ML + 4, y);
    y += headingWrapped.length * 5 + 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...SLATE_BODY);
    const descWrapped = doc.splitTextToSize(line.description, contentW - 10);
    doc.text(descWrapped, ML + 8, y);
    y += descWrapped.length * 5 + 5;
  }

  if (!award.lines.length) {
    doc.setFont("helvetica", "italic");
    doc.text("—", ML + 4, y);
    y += 8;
  }

  y += 6;
  if (y > H - 75) {
    doc.addPage();
    y = 24;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text("Signatures des enseignants", ML, y);
  y += 8;

  const signedProfs = award.designatedSignatories.filter((s) => s.status === "signed");
  for (const prof of signedProfs) {
    if (y > H - 50) {
      doc.addPage();
      y = 24;
    }
    const sigData = await loadProfSigDataUri(prof.clerkUserId);
    const sigW = 40;
    const sigH = 14;
    if (sigData) {
      doc.addImage(sigData, "PNG", ML, y, sigW, sigH);
    } else {
      doc.setDrawColor(...BORDER);
      doc.rect(ML, y, sigW, sigH);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_BODY);
    doc.text(prof.name, ML + sigW + 4, y + 5);
    if (prof.signedAt) {
      doc.setFontSize(8);
      doc.setTextColor(...SLATE_LIGHT);
      doc.text(formatDateLong(prof.signedAt), ML + sigW + 4, y + 10);
    }
    y += sigH + 6;
  }

  if (award.directionSignature) {
    if (y > H - 45) {
      doc.addPage();
      y = 24;
    }
    const levelLabel = CERTIFICATE_SECTEUR_LABELS[award.directionSignature.level];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE);
    doc.text(`Direction — ${levelLabel}`, ML, y);
    y += 6;

    const dirUrl = await resolveDirectionSignatureImageUrl(award.directionSignature.level);
    const dirImg = dirUrl ? await loadImageForPdfFromRef(dirUrl) : null;
    const sigW = 48;
    const sigH = 18;
    if (dirImg) {
      const fitted = fitImageInBox(dirImg.width || sigW, dirImg.height || sigH, sigW, sigH);
      doc.addImage(dirImg.dataUri, dirImg.format, ML, y, fitted.width, fitted.height);
      y += fitted.height + 4;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_BODY);
    doc.text(award.directionSignature.signedByName, ML, y);
    y += 10;
  }

  const qrSize = 28;
  const qrY = H - FOOTER_H - qrSize - 6;
  const qrX = MR - qrSize;
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  } catch {
    /* ignore */
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...SLATE_LIGHT);
  doc.text("Vérifier l'authenticité", qrX + qrSize / 2, qrY + qrSize + 4, { align: "center" });
  doc.text(`Réf. ${shortContentHash(award.contentHash)}`, ML, H - FOOTER_H - 4);

  drawPdfFooter(doc, letterhead);

  return new Uint8Array(doc.output("arraybuffer"));
}

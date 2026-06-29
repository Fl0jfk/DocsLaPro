import "server-only";

import { jsPDF } from "jspdf";
import type { FournituresChild } from "@/app/lib/fournitures-types";
import { formatChildLabel, formatSuppliesPdfFilename } from "@/app/lib/fournitures-engine";
import { fitImageInBox, loadSchoolLogoForPdf } from "@/app/lib/pdf-branding";

export type SuppliesPdfSection = { title: string; items: string[] };

export type SuppliesPdfInput = {
  children: FournituresChild[];
  suppliesByChild: Record<string, SuppliesPdfSection[]>;
};

const HEADER_LOGO_BOX = 13;

/** Génère le PDF liste de fournitures (même rendu que l'envoi par email). */
export async function buildSuppliesListPdf(input: SuppliesPdfInput): Promise<{ buffer: Buffer; filename: string }> {
  const { children, suppliesByChild } = input;
  const logo = await loadSchoolLogoForPdf();

  const doc = new jsPDF({ compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const ML = 14;
  const MR = W - 14;

  const drawHeader = () => {
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, W, 20, "F");
    let titleX = ML;
    if (logo) {
      const fitted = fitImageInBox(
        logo.width || HEADER_LOGO_BOX,
        logo.height || HEADER_LOGO_BOX,
        HEADER_LOGO_BOX,
        HEADER_LOGO_BOX,
      );
      const logoY = 3.5 + (HEADER_LOGO_BOX - fitted.height) / 2;
      doc.addImage(logo.dataUri, logo.format, ML, logoY, fitted.width, fitted.height);
      titleX = ML + HEADER_LOGO_BOX + 4;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("Liste de fournitures scolaires", titleX, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(226, 232, 240);
    doc.text(new Date().toLocaleDateString("fr-FR"), MR, 12, { align: "right" });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(ML, 24, MR, 24);
  };

  const checkbox = (x: number, y: number) => {
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.35);
    doc.rect(x, y - 2.6, 3.3, 3.3);
  };

  const styleListItem = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
  };

  let y = 32;
  const newContentPage = () => {
    doc.addPage();
    drawHeader();
    y = 32;
  };

  drawHeader();

  for (let ci = 0; ci < children.length; ci++) {
    const child = children[ci]!;

    if (y > H - 30) newContentPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(formatChildLabel(child), ML, y);
    y += 6;

    const supplies = suppliesByChild[child.id] ?? null;
    const sections = Array.isArray(supplies) ? supplies : [{ title: "Fournitures", items: ["(liste non transmise)"] }];

    for (const sec of sections) {
      if (y > H - 24) newContentPage();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(37, 99, 235);
      doc.text(sec.title, ML, y);
      y += 5;

      styleListItem();
      for (const item of sec.items || []) {
        const text = String(item || "").trim();
        if (!text) continue;
        if (y > H - 14) {
          newContentPage();
          styleListItem();
        }
        checkbox(ML, y);
        const lines = doc.splitTextToSize(text, MR - (ML + 6));
        doc.text(lines, ML + 6, y);
        y += lines.length * 4.5 + 1.5;
      }
      y += 3;
    }

    if (ci < children.length - 1) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(ML, y, MR, y);
      y += 8;
    }
  }

  const pdfArrayBuffer = doc.output("arraybuffer");
  return {
    buffer: Buffer.from(pdfArrayBuffer),
    filename: formatSuppliesPdfFilename(children),
  };
}

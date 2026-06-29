import "server-only";

import { jsPDF } from "jspdf";
import fs from "fs/promises";
import path from "path";
import type { FournituresChild } from "@/app/lib/fournitures-types";
import { formatChildLabel, formatSuppliesPdfFilename } from "@/app/lib/fournitures-engine";

export type SuppliesPdfSection = { title: string; items: string[] };

export type SuppliesPdfInput = {
  children: FournituresChild[];
  suppliesByChild: Record<string, SuppliesPdfSection[]>;
};

async function loadLogoDataUri(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png");
    const logoBuffer = await fs.readFile(logoPath);
    return `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Génère le PDF liste de fournitures (même rendu que l'envoi par email). */
export async function buildSuppliesListPdf(input: SuppliesPdfInput): Promise<{ buffer: Buffer; filename: string }> {
  const { children, suppliesByChild } = input;
  const logoDataUri = await loadLogoDataUri();

  const doc = new jsPDF({ compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const ML = 14;
  const MR = W - 14;

  const drawHeader = () => {
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, W, 20, "F");
    if (logoDataUri) doc.addImage(logoDataUri, "PNG", ML, 3.5, 13, 13);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("Liste de fournitures scolaires", ML + 18, 12);
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

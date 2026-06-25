import "server-only";

import { jsPDF } from "jspdf";
import {
  drawPdfFooter,
  drawPdfLetterhead,
  getSchoolLetterhead,
  loadSchoolLogoForPdf,
} from "@/app/lib/pdf-branding";
import type { RgpdTemplateSection } from "@/app/lib/rgpd-templates";

const ML = 18;
const MR = 18;
const BODY: [number, number, number] = [51, 65, 85];
const HEADING: [number, number, number] = [15, 23, 42];
const START_Y = 44;

function writeWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
): number {
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, x, y);
  return y + lines.length * lineH;
}

export async function renderRgpdDocumentPdf(input: {
  title: string;
  sections: RgpdTemplateSection[];
  disclaimer?: string;
}): Promise<Uint8Array> {
  const [letterhead, logo] = await Promise.all([getSchoolLetterhead(), loadSchoolLogoForPdf()]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - ML - MR;

  drawPdfLetterhead(doc, letterhead, logo, [79, 70, 229]);

  let y = START_Y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...HEADING);
  y = writeWrapped(doc, input.title, ML, y, maxW, 6) + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BODY);

  if (input.disclaimer) {
    y = writeWrapped(doc, input.disclaimer, ML, y, maxW, 4.2) + 4;
  }

  for (const section of input.sections) {
    if (y > 250) {
      doc.addPage();
      drawPdfLetterhead(doc, letterhead, logo, [79, 70, 229]);
      y = START_Y;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...HEADING);
    y = writeWrapped(doc, section.heading, ML, y, maxW, 5) + 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BODY);
    for (const p of section.paragraphs ?? []) {
      if (y > 265) {
        doc.addPage();
        drawPdfLetterhead(doc, letterhead, logo, [79, 70, 229]);
        y = START_Y;
      }
      y = writeWrapped(doc, p, ML, y, maxW, 4.8) + 2;
    }
    if (section.bullets?.length) {
      for (const b of section.bullets) {
        if (y > 265) {
          doc.addPage();
          drawPdfLetterhead(doc, letterhead, logo, [79, 70, 229]);
          y = START_Y;
        }
        y = writeWrapped(doc, `• ${b}`, ML + 2, y, maxW - 2, 4.6) + 1.5;
      }
    }
    y += 4;
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    drawPdfFooter(doc, letterhead, `Page ${p}/${pages}`);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

import "server-only";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  drawPdfLetterhead,
  getSchoolLetterhead,
  loadSchoolLogoForPdf,
} from "@/app/lib/pdf-branding";
import {
  pdfFormatDateFrLong,
  pdfFormatEuroAmount,
} from "@/app/lib/pdf-format-numbers";
import type { ComptaApelSummary } from "@/app/lib/travels-compta-apel-summary";

function euroPlain(n: number | null | undefined): string {
  return pdfFormatEuroAmount(n);
}

export async function buildComptaApelSummaryPdfBase64(summary: ComptaApelSummary): Promise<string> {
  const [logo, letterhead] = await Promise.all([loadSchoolLogoForPdf(), getSchoolLetterhead()]);

  const doc = new jsPDF({ compress: true });
  const W = doc.internal.pageSize.getWidth();
  const ML = 14;
  const MR = W - 14;
  const dateStr = pdfFormatDateFrLong();

  drawPdfLetterhead(doc, letterhead, logo, [16, 185, 129]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 41, 59);
  doc.text("RÉCAPITULATIF APEL — SORTIES SCOLAIRES", W / 2, 48, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Année scolaire ${summary.schoolYear.label}, 1er septembre au 15 juillet`,
    W / 2,
    55,
    { align: "center" },
  );

  let y = 64;

  const body = summary.trips.map((row) => [
    row.title,
    row.travelDateLabel,
    euroPlain(row.apelCollective),
    euroPlain(row.aidesIndividuelles),
    euroPlain(row.totalApel),
  ]);

  if (body.length === 0) body.push(["—", "—", "—", "—", "—"]);

  autoTable(doc, {
    startY: y,
    head: [["Voyage", "Date", "APEL collectif", "Aides individ.", "Total APEL"]],
    body: [
      ...body,
      [
        "TOTAL ANNÉE SCOLAIRE",
        "",
        euroPlain(summary.totals.apelCollective),
        euroPlain(summary.totals.aidesIndividuelles),
        euroPlain(summary.totals.totalApel),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 52 },
      1: { cellWidth: 38 },
      2: { halign: "right", cellWidth: 28 },
      3: { halign: "right", cellWidth: 28 },
      4: { halign: "right", cellWidth: 28 },
    },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 2.5 },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === body.length) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [236, 253, 245];
      }
    },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Montants = aide APEL collective (ligne recettes) + aides individuelles par élève, tous voyages de l'année.",
    ML,
    y,
    { maxWidth: W - 28 },
  );

  doc.setFontSize(7);
  doc.setTextColor(180, 190, 200);
  doc.text(`Document généré le ${dateStr}`, W / 2, 292, { align: "center" });

  return doc.output("datauristring");
}

export function comptaApelSummaryPdfFilename(schoolYearLabel: string): string {
  const slug = schoolYearLabel.replace(/\s+/g, "_").replace(/–/g, "-");
  return `Recap_APEL_${slug}.pdf`;
}

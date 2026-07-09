import "server-only";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  drawPdfLetterhead,
  getSchoolLetterhead,
  loadSchoolLogoForPdf,
} from "@/app/lib/pdf-branding";
import { pdfFormatDateFr, pdfFormatDateFrLong, pdfFormatEuroAmount, pdfFormatWholeEuro } from "@/app/lib/pdf-format-numbers";
import {
  comptaAfficheMargeSecurite,
  computeComptaSheetDerived,
  resolveFacturationsFromSheet,
  type TravelsComptaSheet,
} from "@/app/lib/travels-compta-sheet";

export type ComptaSheetPdfInput = {
  tripTitle: string;
  destination?: string;
  etablissement?: string;
  sheet: TravelsComptaSheet;
};

const PDF_ML = 14;
const PDF_MR = 14;
const PDF_AMOUNT_COL_W = 42;

function pdfTableWidth(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth() - PDF_ML - PDF_MR;
}

function pdfGridColumnStyles(doc: jsPDF) {
  const tableWidth = pdfTableWidth(doc);
  return {
    0: { cellWidth: tableWidth - PDF_AMOUNT_COL_W },
    1: { halign: "right" as const, cellWidth: PDF_AMOUNT_COL_W },
  };
}

type PdfGridTableOpts = {
  doc: jsPDF;
  startY: number;
  head: [string, string][];
  body: string[][];
  headFillColor: [number, number, number];
  headTextColor: number | [number, number, number];
  boldRowIndices?: number[];
  boldFillColor?: [number, number, number];
};

function drawComptaGridTable({
  doc,
  startY,
  head,
  body,
  headFillColor,
  headTextColor,
  boldRowIndices = [],
  boldFillColor = [238, 242, 255],
}: PdfGridTableOpts): void {
  autoTable(doc, {
    startY,
    head,
    body,
    theme: "grid",
    margin: { left: PDF_ML, right: PDF_MR },
    tableWidth: pdfTableWidth(doc),
    headStyles: {
      fillColor: headFillColor,
      textColor: headTextColor,
      fontStyle: "bold",
      fontSize: 9,
    },
    columnStyles: pdfGridColumnStyles(doc),
    bodyStyles: { fontSize: 8.5 },
    styles: { cellPadding: 3, overflow: "linebreak" },
    didParseCell: (data) => {
      if (data.section === "body" && boldRowIndices.includes(data.row.index)) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = boldFillColor;
      }
    },
  });
}

function pdfLastTableY(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function euro(n: number | null | undefined): string {
  return pdfFormatEuroAmount(n);
}

function euroPlain(n: number | null | undefined): string {
  return pdfFormatEuroAmount(n);
}

export async function buildComptaSheetPdfBase64(input: ComptaSheetPdfInput): Promise<string> {
  const sheet = computeComptaSheetDerived(input.sheet);
  const [logo, letterhead] = await Promise.all([loadSchoolLogoForPdf(), getSchoolLetterhead()]);

  const doc = new jsPDF({ compress: true });
  const W = doc.internal.pageSize.getWidth();
  const ML = PDF_ML;
  const MR = W - PDF_MR;
  const dateStr = pdfFormatDateFrLong();

  drawPdfLetterhead(doc, letterhead, logo, [79, 70, 229]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 41, 59);
  doc.text("FICHE BUDGET — SORTIE SCOLAIRE", W / 2, 48, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const subtitle = [input.tripTitle, input.destination, input.etablissement].filter(Boolean).join(" · ");
  if (subtitle) doc.text(subtitle, W / 2, 55, { align: "center", maxWidth: W - 28 });

  let y = 63;
  const metaRows: [string, string][] = [
    ["Compte", sheet.compte || "—"],
    ["Ligne", sheet.ligne || "—"],
    ["Classe", sheet.classe || "—"],
    ["Profs", sheet.profs || "—"],
    ["Accompagnateurs", sheet.accompagnateurs || "—"],
  ];
  doc.setFontSize(8);
  const colW = (W - 28) / 2;
  metaRows.forEach(([label, value], i) => {
    const col = i % 2 === 0 ? ML : ML + colW + 4;
    if (i % 2 === 0 && i > 0) y += 8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(`${label}`, col, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(value, col + 28, y, { maxWidth: colW - 30 });
  });
  y += 12;

  const depenseBody = sheet.depenses
    .filter((d) => d.label || d.amount != null)
    .map((d) => [d.label || "—", euroPlain(d.amount)]);
  if (depenseBody.length === 0) depenseBody.push(["—", "—"]);
  const totalDepensesRowIndex = depenseBody.length;
  depenseBody.push(["Total dépenses", euroPlain(sheet.depensesTotal)]);
  depenseBody.push(["Nb élèves (joindre une liste)", sheet.nbEleves != null ? String(sheet.nbEleves) : "—"]);
  depenseBody.push(["Coût par élève (total dépenses ÷ nb élèves)", euroPlain(sheet.prixParEleve)]);

  drawComptaGridTable({
    doc,
    startY: y,
    head: [["Dépenses", "Montant"]],
    body: depenseBody,
    headFillColor: [79, 70, 229],
    headTextColor: 255,
    boldRowIndices: [totalDepensesRowIndex],
  });

  y = pdfLastTableY(doc) + 8;

  if (comptaAfficheMargeSecurite(sheet)) {
    const margeBody: string[][] = [
      ["Nb élèves (rappel)", sheet.nbEleves != null ? String(sheet.nbEleves) : "—"],
      ["Total dépenses (rappel)", euroPlain(sheet.depensesTotal)],
      ["Marge de sécurité", euroPlain(sheet.margeRisqueMontant)],
    ];
    const budgetPrevisionnelRowIndex = margeBody.length;
    margeBody.push(["Budget prévisionnel total", euroPlain(sheet.montantCibleFacturation)]);
    margeBody.push([
      "Coût prévisionnel par élève (arrondi à l'entier supérieur)",
      sheet.coutPrevisionnelParEleve != null
        ? pdfFormatWholeEuro(sheet.coutPrevisionnelParEleve)
        : "—",
    ]);

    drawComptaGridTable({
      doc,
      startY: y,
      head: [["Marge de sécurité", "Montant"]],
      body: margeBody,
      headFillColor: [255, 251, 235],
      headTextColor: [146, 64, 14],
      boldRowIndices: [budgetPrevisionnelRowIndex, budgetPrevisionnelRowIndex + 1],
      boldFillColor: [255, 251, 235],
    });
    y = pdfLastTableY(doc) + 8;
  }

  const f = resolveFacturationsFromSheet(sheet)[0];
  const dateFacturationLabel = f?.dateFacturation ? pdfFormatDateFr(f.dateFacturation) : "—";

  const recettesLignesRows = (sheet.recettesLignes ?? [])
    .filter((r) => r.label.trim() || r.amount != null)
    .map((r) => [r.label.trim() || "—", euroPlain(r.amount)]);

  const recettesBody: string[][] = [...recettesLignesRows];
  if (recettesLignesRows.length === 0) recettesBody.push(["—", "—"]);
  if (sheet.totalSubventions != null && sheet.totalSubventions > 0) {
    recettesBody.push(["Total recettes complémentaires", euroPlain(sheet.totalSubventions)]);
  }
  recettesBody.push([
    `Recettes élèves (facturé le ${dateFacturationLabel})`,
    euroPlain(sheet.recettesEleves),
  ]);
  const totalRecettesRowIndex = recettesBody.length;
  recettesBody.push([
    "Total recettes + subventions (hors aides individuelles)",
    euroPlain(sheet.totalRecettes),
  ]);
  recettesBody.push([
    "Prix par élève définitif (arrondi à l'entier supérieur)",
    pdfFormatWholeEuro(sheet.prixParEleveAvecSubventions),
  ]);

  drawComptaGridTable({
    doc,
    startY: y,
    head: [["Recettes", "Montant"]],
    body: recettesBody,
    headFillColor: [79, 70, 229],
    headTextColor: 255,
    boldRowIndices: [totalRecettesRowIndex, totalRecettesRowIndex + 1],
    boldFillColor: [238, 242, 255],
  });

  y = pdfLastTableY(doc) + 8;

  const depenseDetailRows = sheet.depenses
    .filter((d) => d.label || d.amount != null)
    .map((d) => [d.label || "—", euroPlain(d.amount)]);
  if (depenseDetailRows.length > 0) {
    drawComptaGridTable({
      doc,
      startY: y,
      head: [["Détail des dépenses (lecture seule)", "Montant"]],
      body: depenseDetailRows,
      headFillColor: [241, 245, 249],
      headTextColor: [51, 65, 85],
    });
    y = pdfLastTableY(doc) + 8;
  }

  if (sheet.recettesElevesFigees) {
    drawComptaGridTable({
      doc,
      startY: y,
      head: [["Prix déjà annoncé aux parents", "Montant"]],
      body: [
        ["Prix annoncé / élève", euroPlain(sheet.prixParEleveAnnonce)],
        ["Nb élèves facturés", sheet.nbElevesFactures != null ? String(sheet.nbElevesFactures) : "—"],
      ],
      headFillColor: [245, 243, 255],
      headTextColor: [91, 33, 182],
    });
    y = pdfLastTableY(doc) + 8;
  }

  const aideRows = sheet.aidesIndividuelles
    .filter((a) => a.name?.trim() || (a.amount != null && a.amount !== 0))
    .map((a) => [a.name?.trim() || "—", euroPlain(a.amount)]);

  if (aideRows.length > 0) {
    drawComptaGridTable({
      doc,
      startY: y,
      head: [["APEL — aides individuelles", "Montant"]],
      body: [
        ...aideRows,
        ["Total aides individuelles (informatif)", euroPlain(sheet.totalAidesIndividuelles)],
      ],
      headFillColor: [79, 70, 229],
      headTextColor: 255,
      boldRowIndices: [aideRows.length],
      boldFillColor: [248, 250, 252],
    });
    y = pdfLastTableY(doc) + 10;
  } else {
    y += 2;
  }
  const deficit = sheet.excedentOuDeficit;
  const positive = deficit != null && deficit >= 0;
  const negative = deficit != null && deficit < 0;
  doc.setFillColor(
    negative ? 254 : positive ? 236 : 248,
    negative ? 226 : positive ? 253 : 250,
    negative ? 226 : positive ? 245 : 252,
  );
  doc.roundedRect(ML, y, W - 28, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(
    negative ? 185 : positive ? 6 : 71,
    negative ? 28 : positive ? 95 : 85,
    negative ? 28 : positive ? 70 : 105,
  );
  doc.text("Excédent ou déficit", ML + 4, y + 8);
  doc.text(euro(deficit), MR - 4, y + 8, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(180, 190, 200);
  doc.text(`Document généré le ${dateStr}`, W / 2, 292, { align: "center" });

  return doc.output("datauristring");
}

export function comptaSheetPdfFilename(tripTitle: string): string {
  const slug = tripTitle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return `Fiche_Compta_${slug || "sortie"}.pdf`;
}

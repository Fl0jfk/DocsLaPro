import "server-only";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  drawPdfLetterhead,
  getSchoolLetterhead,
  loadSchoolLogoForPdf,
} from "@/app/lib/pdf-branding";
import {
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

function euro(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function euroPlain(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)} €`;
}

export async function buildComptaSheetPdfBase64(input: ComptaSheetPdfInput): Promise<string> {
  const sheet = computeComptaSheetDerived(input.sheet);
  const [logo, letterhead] = await Promise.all([loadSchoolLogoForPdf(), getSchoolLetterhead()]);

  const doc = new jsPDF({ compress: true });
  const W = doc.internal.pageSize.getWidth();
  const ML = 14;
  const MR = W - 14;
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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
  depenseBody.push(["Total dépenses", euroPlain(sheet.depensesTotal)]);

  autoTable(doc, {
    startY: y,
    head: [["Dépenses", "Montant"]],
    body: depenseBody,
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", fontSize: 9 },
    columnStyles: { 0: { cellWidth: 120 }, 1: { halign: "right", cellWidth: 40 } },
    bodyStyles: { fontSize: 8.5 },
    styles: { cellPadding: 3 },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === depenseBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [238, 242, 255];
      }
    },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [["Synthèse dépenses", ""]],
    body: [
      ["Nb élèves (joindre une liste)", sheet.nbEleves != null ? String(sheet.nbEleves) : "—"],
      ["Prix par élève (total dépenses ÷ nb élèves)", euroPlain(sheet.prixParEleve)],
    ],
    theme: "plain",
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: "bold", fontSize: 9 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { halign: "right" } },
    bodyStyles: { fontSize: 8.5 },
    styles: { cellPadding: 2.5 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [["Recettes", ""]],
    body: [
      ["Total recettes + subventions (hors aides individuelles)", euroPlain(sheet.totalRecettes)],
      ["Recettes élèves", euroPlain(sheet.recettesEleves)],
      ...(sheet.totalSubventions != null && sheet.totalSubventions > 0
        ? [["Subventions (APEL + autres)", euroPlain(sheet.totalSubventions)]]
        : []),
      ["Total dépenses", euroPlain(sheet.depensesTotal)],
      ...(sheet.prixFactureBus != null
        ? [["Prix facture (devis bus)", euroPlain(sheet.prixFactureBus)]]
        : []),
      ...(sheet.autresDepensesHorsBus != null && sheet.autresDepensesHorsBus > 0
        ? [["Autres dépenses", euroPlain(sheet.autresDepensesHorsBus)]]
        : []),
      ["Marge de sécurité", euroPlain(sheet.margeRisqueMontant)],
      ["Montant à facturer aux élèves", euroPlain(sheet.depensesAvecMargeRisque)],
      ...(sheet.prixParEleveAvantMargeRisque != null
        ? [["Prix / élève avant marge", euroPlain(sheet.prixParEleveAvantMargeRisque)]]
        : []),
      [
        "Prix par élève définitif",
        euroPlain(sheet.prixParEleveAvecSubventions),
      ],
    ],
    theme: "plain",
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: "bold", fontSize: 9 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { halign: "right" } },
    bodyStyles: { fontSize: 8.5 },
    styles: { cellPadding: 2.5 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const facturationRows: [string, string][] = [];
  const f = resolveFacturationsFromSheet(sheet)[0];
  if (f?.dateFacturation) {
    facturationRows.push([
      "Date de facturation",
      new Date(f.dateFacturation).toLocaleDateString("fr-FR"),
    ]);
  }

  if (facturationRows.length === 0) facturationRows.push(["—", "—"]);

  autoTable(doc, {
    startY: y,
    head: [["Facturation", ""]],
    body: facturationRows,
    theme: "plain",
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: "bold", fontSize: 9 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { halign: "right" } },
    bodyStyles: { fontSize: 8.5 },
    styles: { cellPadding: 2.5 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const aideRows = sheet.aidesIndividuelles
    .filter((a) => a.name || a.amount != null)
    .map((a) => [a.name || "—", euroPlain(a.amount)]);
  while (aideRows.length < 2) aideRows.push(["", "—"]);

  autoTable(doc, {
    startY: y,
    head: [["Subventions", "Montant"]],
    body: [
      ["APEL — aides collectives", euroPlain(sheet.apelAidesCollectives)],
      ["Autres subventions", euroPlain(sheet.autresSubventions)],
      ...aideRows.map(([name, amt], i) => [
        i === 0 ? "APEL — aide individuelle" : "APEL — aide individuelle (suite)",
        name ? `${name} : ${amt}` : amt,
      ]),
      ["Total aides individuelles (informatif)", euroPlain(sheet.totalAidesIndividuelles)],
    ],
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", fontSize: 9 },
    columnStyles: { 0: { cellWidth: 120 }, 1: { halign: "right" } },
    bodyStyles: { fontSize: 8.5 },
    styles: { cellPadding: 3 },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === 2 + aideRows.length) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [248, 250, 252];
      }
    },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
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
  doc.text("Excédent ou déficit (recettes − dépenses)", ML + 4, y + 8);
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

import "server-only";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs/promises";
import path from "path";
import {
  CUISINE_DAYS,
  CUISINE_ROWS,
  cuisineDateRangeLabel,
  type CuisineTripPayload,
} from "@/app/lib/travels-cuisine-shared";

export type { CuisineTripPayload } from "@/app/lib/travels-cuisine-shared";
export {
  CUISINE_DAYS,
  CUISINE_ROWS,
  formatCuisineDateFR,
  cuisineDateRangeLabel,
} from "@/app/lib/travels-cuisine-shared";

export async function buildCuisineOrderPdfBase64(
  tripData: CuisineTripPayload,
  opts?: { userName?: string; chefEmail?: string; amendment?: boolean },
): Promise<string> {
  const details = tripData.data.piqueNiqueDetails;
  if (!details?.active) throw new Error("Aucune commande cuisine active");

  let logoDataUri: string | null = null;
  try {
    const logoPath = path.join(
      process.cwd(),
      "public",
      "logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png",
    );
    const logoBuffer = await fs.readFile(logoPath);
    logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch (e) {
    console.error("Logo load error:", e);
  }

  const doc = new jsPDF({ compress: true });
  const W = doc.internal.pageSize.getWidth();
  const ML = 15;
  const MR = W - 15;
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const dateRange = cuisineDateRangeLabel(tripData.data);
  const chefEmail = opts?.chefEmail || "chef.0056isi@newrest.eu";
  const userName = opts?.userName || "—";

  if (logoDataUri) doc.addImage(logoDataUri, "PNG", ML, 6, 24, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text("La Providence Nicolas Barré", MR, 13, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Groupe scolaire catholique sous contrat", MR, 19, { align: "right" });
  doc.text("6, rue de Neuvillette — 76240 Le Mesnil-Esnard", MR, 24.5, { align: "right" });
  doc.text("02 32 86 50 90", MR, 30, { align: "right" });
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 35, W, 1.8, "F");
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 36.8, W, 0.6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  const titleLine = opts?.amendment ? "BON DE COMMANDE CUISINE (NOUVELLE VERSION)" : "BON DE COMMANDE CUISINE";
  doc.text(titleLine, W / 2, 48, { align: "center" });
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(ML, 52, W - 30, 7, 2, 2, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text(
    `À déposer 15 jours avant la date au chef en cuisine ou envoyer par mail : ${chefEmail}`,
    W / 2,
    57,
    { align: "center" },
  );
  let y = 67;
  const infoRows: [string, string][] = [
    ["Classe(s)", tripData.data.classes || "—"],
    ["Date(s) de sortie", dateRange],
    ["Organisateur", userName],
    ["Lieu récupération", `${details.deliveryPlace || "—"} à ${details.deliveryTime || "—"}`],
    ["Nb élèves", String(tripData.data.nbEleves || "—")],
    ["Nb adultes", String(tripData.data.nbAccompagnateurs || "—")],
  ];
  doc.setFontSize(8);
  const colW = (W - 30) / 2;
  infoRows.forEach(([label, value], i) => {
    const col = i % 2 === 0 ? ML : ML + colW + 5;
    if (i % 2 === 0 && i > 0) y += 9;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(`${label} :`, col, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(value, col + 32, y);
  });
  y += 13;
  doc.setDrawColor(226, 232, 240);
  doc.line(ML, y, MR, y);
  y += 6;
  const selectedDays = CUISINE_DAYS.filter((d) => details.daysSelection?.[d.key]);
  const head = [["Désignation", ...selectedDays.map((d) => d.label)]];
  const orders = details.orders || {};
  const body = CUISINE_ROWS.map(({ key: rowKey, label }) => {
    const cells = selectedDays.map((d) => {
      const val = orders[d.key]?.[rowKey];
      return val && val !== "" ? String(val) : "—";
    });
    return [label, ...cells];
  });
  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: "bold", fontSize: 8, halign: "center" },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: "normal" },
      ...Object.fromEntries(
        selectedDays.map((_, i) => [
          i + 1,
          { halign: "center", cellWidth: (W - 30 - 60) / (selectedDays.length || 1) },
        ]),
      ),
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    styles: { cellPadding: 3 },
  });
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Fournir la liste des élèves et adultes au moment de la commande (15 jours avant). Affiner la liste 24h avant.",
    ML,
    finalY,
  );
  doc.text("Toute absence non signalée 24h avant sera facturée.", ML, finalY + 4.5);
  if (opts?.amendment) {
    doc.setTextColor(180, 83, 9);
    doc.text("Ce document annule et remplace toute commande précédente pour cette sortie.", ML, finalY + 9);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(180, 190, 200);
  doc.text(`Document généré le ${dateStr}`, W / 2, 292, { align: "center" });
  return doc.output("datauristring").split(",")[1];
}

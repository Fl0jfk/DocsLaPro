import "server-only";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs/promises";
import path from "path";

export { orderEmailForQuote } from "@/app/lib/travels-transport-shared";

const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const MOIS_INDEX: Record<string, number> = {
  janvier: 0, janv: 0, february: 1, fév: 1, février: 1, fevrier: 1, fev: 1,
  mars: 2, march: 2, avril: 3, april: 3, mai: 4, june: 5, juin: 5,
  july: 6, juillet: 6, août: 7, aout: 7, august: 7, septembre: 8, sep: 8, sept: 8,
  october: 9, oct: 9, octobre: 9, novembre: 10, nov: 10, november: 10,
  décembre: 11, decembre: 11, dec: 11, december: 11,
};

function formatDateFR(input?: string | null) {
  if (!input) return "—";
  const raw = String(input).trim();
  const isoFull = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoFull) {
    const [, y, mm, dd] = isoFull;
    const monthName = MOIS_FR[Number(mm) - 1] || "";
    return `${Number(dd)} ${monthName} ${y}`;
  }
  const isoMonth = raw.match(/^(\d{4})-(\d{2})$/);
  if (isoMonth) {
    const [, y, mm] = isoMonth;
    return `1 ${MOIS_FR[Number(mm) - 1] || ""} ${y}`;
  }
  const monthYear = raw.match(/^([A-Za-zÀ-ÿœŒ]+)\s+(\d{4})$/);
  if (monthYear) {
    const [, m, y] = monthYear;
    const key = String(m).toLowerCase().replace(/\./g, "");
    const monthIdx = MOIS_INDEX[key];
    const monthName = typeof monthIdx === "number" ? MOIS_FR[monthIdx] : key;
    return `1 ${monthName} ${y}`;
  }
  return raw;
}

export type TransportQuotePdfMode = "initial" | "amendment";

export type BuildTransportQuotePdfInput = {
  tripId: string;
  data: Record<string, any>;
  userName: string;
  transporteurName: string;
  mode?: TransportQuotePdfMode;
  previousEffectif?: { nbEleves: number; nbAccompagnateurs: number };
};

let logoCache: string | null | undefined;

async function loadLogoDataUri() {
  if (logoCache !== undefined) return logoCache;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png");
    const logoBuffer = await fs.readFile(logoPath);
    logoCache = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    logoCache = null;
  }
  return logoCache;
}

export async function buildTransportQuotePdf(input: BuildTransportQuotePdfInput): Promise<Buffer> {
  const { tripId, data, userName, transporteurName, mode = "initial", previousEffectif } = input;
  const logoDataUri = await loadLogoDataUri();
  const doc = new jsPDF({ compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const ML = 15;
  const MR = W - 15;
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const departDateRaw = data.startDate || data.date;
  const returnDateRaw = data.endDate || data.date;
  const departText = [formatDateFR(departDateRaw), data.startTime ? `à ${data.startTime}` : ""].filter(Boolean).join(" ");
  const returnText = [formatDateFR(returnDateRaw), data.endTime ? `à ${data.endTime}` : ""].filter(Boolean).join(" ");
  const effectifTotal = Number(data.nbEleves) + Number(data.nbAccompagnateurs || 0);
  const isAmendment = mode === "amendment";

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
  doc.setFillColor(isAmendment ? 180 : 37, isAmendment ? 83 : 99, isAmendment ? 9 : 235);
  doc.rect(0, 36.8, W, 0.6, "F");

  const colA = ML;
  const colB = W / 2 + 8;
  let yA = 45;
  let yB = 45;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Professeur demandeur :", colA, yA);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(userName, colA, yA + 5);
  yA += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("DESTINATAIRE", colB, yB);
  yB += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(transporteurName, colB, yB);
  yB += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("DATE D'ENVOI", colB, yB);
  yB += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(dateStr, colB, yB);

  const sepY = Math.max(yA, yB) + 9;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(ML, sepY, MR, sepY);
  let sy = sepY + 10;
  doc.setFillColor(isAmendment ? 180 : 37, isAmendment ? 83 : 99, isAmendment ? 9 : 235);
  doc.rect(ML, sy - 5, 2.5, 13, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("OBJET", ML + 7, sy - 0.5);
  sy += 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(isAmendment ? "Avenant — demande de devis rectifié" : "Demande de devis transport", ML + 7, sy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Réf. ${tripId}`, MR, sy, { align: "right" });
  sy += 10;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  let intro: string;
  if (isAmendment && previousEffectif) {
    const prevTotal = previousEffectif.nbEleves + previousEffectif.nbAccompagnateurs;
    intro =
      `Nous nous excusons de vous recontacter. Suite à une modification du nombre de participants ` +
      `(précédemment ${prevTotal} personnes, dont ${previousEffectif.nbAccompagnateurs} adultes), ` +
      `nous sollicitons un devis rectifié pour la prestation ci-dessous. Merci de nous faire parvenir votre nouvelle offre tarifaire.`;
  } else if (isAmendment) {
    intro =
      "Nous nous excusons de vous recontacter. Suite à une modification du nombre de participants, " +
      "nous sollicitons un devis rectifié pour la prestation ci-dessous. Merci de nous faire parvenir votre nouvelle offre tarifaire.";
  } else {
    intro =
      "Nous vous adressons, par la présente, une demande de devis pour la prestation de transport scolaire décrite ci-dessous. " +
      "Nous vous remercions de bien vouloir nous faire parvenir votre offre tarifaire dans les meilleurs délais.";
  }
  const introLines = doc.splitTextToSize(intro, MR - ML);
  doc.text(introLines, ML, sy);
  sy += introLines.length * 4.5 + 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("DÉTAILS DE LA PRESTATION", ML, sy);
  sy += 3.5;

  const tableBody: string[][] = [
    ["Projet", data.title || "—"],
    ["Réf. dossier (à rappeler par e-mail)", String(tripId)],
    ["Classes concernées", data.classes || "—"],
    ["Destination", data.destination || "—"],
    ["Date de départ", departText],
    ["Date de retour", returnText],
    ["Lieu de RDV / Départ", data.transportRequest?.pickupPoint || "—"],
    ["Effectif total", `${effectifTotal} personnes (dont ${data.nbAccompagnateurs || 0} adultes)`],
    ["Bus reste sur place", data.transportRequest?.stayOnSite ? "Oui" : "Non"],
  ];
  if (isAmendment && previousEffectif) {
    const prevTotal = previousEffectif.nbEleves + previousEffectif.nbAccompagnateurs;
    tableBody.push([
      "Ancien effectif (devis précédent)",
      `${prevTotal} personnes (dont ${previousEffectif.nbAccompagnateurs} adultes)`,
    ]);
  }

  autoTable(doc, {
    startY: sy,
    body: tableBody,
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 58, fontStyle: "bold", textColor: [30, 41, 59] as [number, number, number] },
      1: { textColor: [71, 85, 105] as [number, number, number] },
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.2,
  });

  if (data.transportRequest?.freeText) {
    const afterY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("INFORMATIONS COMPLÉMENTAIRES", ML, afterY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const freeLines = doc.splitTextToSize(String(data.transportRequest.freeText), MR - ML);
    doc.text(freeLines, ML, afterY + 5.5);
  }

  const closingY = (doc as any).lastAutoTable.finalY + 50;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    isAmendment
      ? "Nous vous prions de bien vouloir nous excuser pour ce désagrément et restons à votre disposition."
      : "Dans l'attente de votre retour, nous vous adressons nos cordiales salutations.",
    ML,
    closingY,
  );
  doc.setFillColor(241, 245, 249);
  doc.rect(0, H - 14, W, 14, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(0, H - 14, W, H - 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Groupe Scolaire La Providence Nicolas Barré  ·  Établissement catholique sous contrat avec l'État",
    ML,
    H - 7,
  );
  doc.text("76240 Le Mesnil-Esnard", MR, H - 7, { align: "right" });
  return Buffer.from(doc.output("arraybuffer"));
}


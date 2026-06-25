import "server-only";

import { jsPDF } from "jspdf";
import {
  drawPdfFooter,
  drawPdfLetterhead,
  getSchoolLetterhead,
  loadSchoolLogoForPdf,
} from "@/app/lib/pdf-branding";
import type {
  RgpdDataBreachFields,
  RgpdIncident,
  RgpdSecurityIncidentFields,
} from "@/app/lib/rgpd-types";

const ML = 18;
const START_Y = 44;

function row(doc: jsPDF, label: string, value: string, y: number, maxW: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(label, ML, y);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(value || "—", maxW);
  doc.text(lines, ML, y + 4.5);
  return y + 4.5 + lines.length * 4.2 + 3;
}

export async function buildRgpdIncidentPdf(incident: RgpdIncident): Promise<Uint8Array> {
  const [letterhead, logo] = await Promise.all([getSchoolLetterhead(), loadSchoolLogoForPdf()]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - ML - 18;
  const title =
    incident.kind === "violation_donnees"
      ? "Fiche incident — violation de données"
      : "Fiche incident — sécurité informatique";

  drawPdfLetterhead(doc, letterhead, logo, [79, 70, 229]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, ML, START_Y);

  let y = START_Y + 10;
  doc.setFontSize(9);
  y = row(doc, "Référence", incident.id, y, maxW);
  y = row(doc, "Titre", incident.title, y, maxW);
  y = row(
    doc,
    "Créé le",
    new Date(incident.createdAt).toLocaleString("fr-FR"),
    y,
    maxW,
  );
  y = row(doc, "Par", incident.createdBy.name, y, maxW);

  if (incident.kind === "violation_donnees") {
    const f = incident.fields as RgpdDataBreachFields;
    y = row(doc, "Date de découverte", f.discoveredAt || "", y, maxW);
    y = row(doc, "Nature", f.nature || "", y, maxW);
    y = row(doc, "Catégories de données", f.dataCategories || "", y, maxW);
    y = row(
      doc,
      "Personnes concernées (estimation)",
      f.affectedCount != null ? String(f.affectedCount) : "",
      y,
      maxW,
    );
    y = row(doc, "Gravité", f.severity || "", y, maxW);
    y = row(doc, "Mesures immédiates", f.immediateMeasures || "", y, maxW);
    y = row(
      doc,
      "Notification CNIL requise",
      f.cnilNotificationRequired ? "Oui" : "Non",
      y,
      maxW,
    );
    y = row(doc, "Personnes informées", f.dataSubjectsNotified ? "Oui" : "Non", y, maxW);
    y = row(doc, "Responsable", f.responsibleName || "", y, maxW);
    y = row(doc, "Chronologie", f.timeline || "", y, maxW);
    y = row(doc, "Description", f.description || "", y, maxW);
  } else {
    const f = incident.fields as RgpdSecurityIncidentFields;
    y = row(doc, "Date / heure", f.occurredAt || "", y, maxW);
    y = row(doc, "Type d'incident", f.incidentType || "", y, maxW);
    y = row(doc, "Systèmes impactés", f.impactedSystems || "", y, maxW);
    y = row(doc, "Données potentiellement concernées", f.potentialDataImpact || "", y, maxW);
    y = row(doc, "Mesures de confinement", f.containmentMeasures || "", y, maxW);
    y = row(doc, "Prestataire contacté", f.providerContacted || "", y, maxW);
    y = row(doc, "Statut", f.status || "", y, maxW);
    y = row(doc, "Description", f.description || "", y, maxW);
  }

  drawPdfFooter(doc, letterhead);
  return new Uint8Array(doc.output("arraybuffer"));
}

import nodemailer from "nodemailer";
import { loadTenantConfig } from "@/app/lib/tenant-config";

function appUrl() { return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");}

function getMailer() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export type TravelsTripForNotify = {
  ownerName?: string;
  type?: string;
  status?: string;
  data?: {
    title?: string;
    destination?: string;
    etablissement?: string;
    startDate?: string;
    endDate?: string;
    date?: string;
    nbEleves?: string | number;
    nbAccompagnateurs?: string | number;
    coutTotal?: string | number;
  };
  history?: Array<{ action?: string; note?: string; user?: string; date?: string }>;
};

export async function notifyComptaTravelsPhase(params: {
  orgId: string;
  tripId: string;
  trip: TravelsTripForNotify;
  previousStatus?: string | null;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[travels-notify] SMTP non configuré — pas d’e-mail compta.");
    return;
  }

  const d = params.trip.data || {};
  const title = String(d.title || "Sans titre");
  const destination = String(d.destination || "—");
  const etab = String(d.etablissement || "Groupe scolaire");
  const typeLabel = params.trip.type === "COMPLEX" ? "Voyage complexe" : "Sortie simple";
  const dateInfo =
    d.startDate || d.endDate
      ? `du ${d.startDate || d.date || "—"} au ${d.endDate || d.date || "—"}`
      : String(d.date || "—");
  const lastHistory = params.trip.history?.length
    ? params.trip.history[params.trip.history.length - 1]
    : undefined;
  const transitionNote = lastHistory?.note?.trim() || "";
  const transitionBy = lastHistory?.user?.trim() || "";
  const fromStatus = params.previousStatus?.trim() || "—";
  const link = appUrl() ? `${appUrl()}/travels/${params.tripId}` : `/travels/${params.tripId}`;
  const bundle = await loadTenantConfig(params.orgId);
  const toList =
    bundle.travels.comptaEmails?.length > 0
      ? bundle.travels.comptaEmails
      : bundle.notifications.travelsCompta;
  if (!toList.length) {
    console.warn("[travels-notify] Aucun email compta configuré.");
    return;
  }

  await getMailer().sendMail({
    from: `"Plateforme Voyages" <${process.env.SMTP_USER}>`,
    to: toList.join(", "),
    subject: `[Travels] Dossier en attente comptabilité — ${title}`,
    text: [
      `Bonjour,`,
      ``,
      `Un dossier de sortie vient d’être transmis à l’étape Finances (comptabilité) sur Travels.`,
      ``,
      `Titre : ${title}`,
      `Type : ${typeLabel}`,
      `Établissement : ${etab}`,
      `Destination : ${destination}`,
      `Dates : ${dateInfo}`,
      `Créé par : ${params.trip.ownerName || "—"}`,
      `Effectif : ${d.nbEleves ?? "—"} élèves / ${d.nbAccompagnateurs ?? "—"} accompagnateurs`,
      d.coutTotal != null && d.coutTotal !== "" ? `Budget prévisionnel : ${d.coutTotal} €` : "",
      ``,
      `Étape précédente : ${fromStatus}`,
      transitionNote ? `Dernière action : ${transitionNote}` : "",
      transitionBy ? `Par : ${transitionBy}` : "",
      ``,
      `Consulter le dossier : ${link}`,
      ``,
      `Cordialement,`,
      `Plateforme Voyages — ${bundle.identity.shortName || bundle.identity.name}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

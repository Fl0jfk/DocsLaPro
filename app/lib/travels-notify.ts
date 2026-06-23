import { loadAppConfig } from "@/app/lib/app-config";
import { createTenantTransporter, getTenantSmtpConfig } from "@/app/lib/tenant-mail";
import { tenantAbsolutePath } from "@/app/lib/tenant-context";

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
  tripId: string;
  trip: TravelsTripForNotify;
  previousStatus?: string | null;
}) {
  const smtp = await getTenantSmtpConfig();
  if (!smtp) {
    console.warn("[travels-notify] SMTP non configuré — pas d’e-mail compta.");
    return;
  }
  const transporter = await createTenantTransporter();
  if (!transporter) return;

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
  const link = await tenantAbsolutePath(`/travels/${params.tripId}`);
  const bundle = await loadAppConfig();
  const toList =
    bundle.travels.comptaEmails?.length > 0
      ? bundle.travels.comptaEmails
      : bundle.notifications.travelsCompta;
  if (!toList.length) {
    console.warn("[travels-notify] Aucun email compta configuré.");
    return;
  }

  await transporter.sendMail({
    from: `"Plateforme Voyages" <${smtp.user}>`,
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

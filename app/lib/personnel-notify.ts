import { loadAppConfig } from "@/app/lib/app-config";
import {
  createTenantTransporter,
  getTenantSmtpConfig,
} from "@/app/lib/tenant-mail";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
}

export async function notifyPersonnelSignatureLink(params: {
  to: string;
  employeeName: string;
  signatureLabel: string;
  kind: "onboarding" | "offboarding";
  token: string;
}) {
  const smtp = await getTenantSmtpConfig();
  if (!smtp) return { sent: false, reason: "smtp" };
  const transporter = await createTenantTransporter();
  if (!transporter) return { sent: false, reason: "smtp" };

  const bundle = await loadAppConfig();
  const base = appUrl();
  const link = base
    ? `${base}/rh/signature?token=${encodeURIComponent(params.token)}`
    : `/rh/signature?token=${encodeURIComponent(params.token)}`;

  const kindLabel = params.kind === "onboarding" ? "intégration" : "fin de contrat";

  const text = [
    "Bonjour,",
    "",
    `Un document RH concernant ${params.employeeName} (${kindLabel}) est en attente de votre signature : ${params.signatureLabel}.`,
    "",
    "En cliquant sur « Je signe », vous confirmez avoir pris connaissance du document et valider votre accord.",
    "",
    link,
    "",
    "Cordialement,",
    bundle.identity.shortName || bundle.identity.name,
  ].join("\n");

  await transporter.sendMail({
    from: `"RH ${bundle.identity.shortName || "La Providence"}" <${smtp.user}>`,
    to: params.to,
    subject: `[RH] Signature requise — ${params.employeeName}`,
    text,
  });

  return { sent: true };
}

export async function notifyPersonnelLeaveDecision(params: {
  to: string;
  employeeName: string;
  approved: boolean;
  startDate: string;
  endDate: string;
  note?: string;
}) {
  const smtp = await getTenantSmtpConfig();
  if (!smtp) return { sent: false, reason: "smtp" };
  const transporter = await createTenantTransporter();
  if (!transporter) return { sent: false, reason: "smtp" };

  const bundle = await loadAppConfig();
  const text = [
    "Bonjour,",
    "",
    params.approved
      ? `Votre demande d'absence du ${params.startDate} au ${params.endDate} a été validée.`
      : `Votre demande d'absence du ${params.startDate} au ${params.endDate} a été refusée.`,
    params.note ? `Motif : ${params.note}` : null,
    "",
    "Cordialement,",
    bundle.identity.shortName || bundle.identity.name,
  ]
    .filter(Boolean)
    .join("\n");

  await transporter.sendMail({
    from: `"RH ${bundle.identity.shortName || "La Providence"}" <${smtp.user}>`,
    to: params.to,
    subject: `[RH] Demande d'absence — ${params.approved ? "validée" : "refusée"}`,
    text,
  });

  return { sent: true };
}

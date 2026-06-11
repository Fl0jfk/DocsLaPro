import nodemailer from "nodemailer";
import { loadAppConfig } from "@/app/lib/app-config";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
}

function getMailer() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function notifyPersonnelSignatureLink(params: {
  to: string;
  employeeName: string;
  signatureLabel: string;
  kind: "onboarding" | "offboarding";
  token: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { sent: false, reason: "smtp" };
  }

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

  await getMailer().sendMail({
    from: `"RH ${bundle.identity.shortName || "La Providence"}" <${process.env.SMTP_USER}>`,
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
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { sent: false, reason: "smtp" };
  }

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

  await getMailer().sendMail({
    from: `"RH ${bundle.identity.shortName || "La Providence"}" <${process.env.SMTP_USER}>`,
    to: params.to,
    subject: `[RH] Demande d'absence — ${params.approved ? "validée" : "refusée"}`,
    text,
  });

  return { sent: true };
}

import { loadAppConfig } from "@/app/lib/app-config";
import { createTenantTransporter, getTenantSmtpConfig } from "@/app/lib/tenant-mail";
import { scheduleSummary } from "@/app/lib/stage-schedule";
import { resolveStagesAdminEmails } from "@/app/lib/stage-config";
import {
  STAGE_CONVENTION_STATUS_LABELS,
  STAGE_SIGNER_ROLE_LABELS,
  type StageConvention,
  type StageSignature,
} from "@/app/lib/stage-types";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
}

function signLink(token: string) {
  const base = appUrl();
  const path = `/stages/signer?token=${encodeURIComponent(token)}`;
  return base ? `${base}${path}` : path;
}

function studentLink(token: string) {
  const base = appUrl();
  const path = `/stages/eleve?token=${encodeURIComponent(token)}`;
  return base ? `${base}${path}` : path;
}

async function mailer() {
  const smtp = await getTenantSmtpConfig();
  if (!smtp) return null;
  const transporter = await createTenantTransporter();
  if (!transporter) return null;
  return { smtp, transporter };
}

function studentLabel(c: StageConvention) {
  return `${c.student.firstName} ${c.student.lastName}`.trim();
}

export async function notifyStagePreconventionSubmitted(convention: StageConvention) {
  const m = await mailer();
  if (!m) return { sent: false, reason: "smtp" as const };

  const recipients = await resolveStagesAdminEmails();
  if (!recipients.length) return { sent: false, reason: "no_recipients" as const };

  const bundle = await loadAppConfig();
  const school = bundle.identity.shortName || bundle.identity.name;
  const text = [
    "Bonjour,",
    "",
    `Une préconvention de stage a été déposée et attend votre validation.`,
    "",
    `Élève : ${studentLabel(convention)} (${convention.student.className})`,
    `Entreprise : ${convention.company.name}`,
    `Période : ${convention.schedule.periodStart} → ${convention.schedule.periodEnd}`,
    `Horaires : ${scheduleSummary(convention.schedule)}`,
    "",
    `Connectez-vous à l'intranet → module Stages & conventions pour valider.`,
    "",
    "Cordialement,",
    school,
  ].join("\n");

  for (const to of recipients) {
    await m.transporter.sendMail({
      from: `"Stages ${school}" <${m.smtp.user}>`,
      to,
      subject: `[Stages] Préconvention à valider — ${studentLabel(convention)}`,
      text,
    });
  }
  return { sent: true, recipients };
}

export async function notifyStageAdminRejected(convention: StageConvention, note?: string) {
  const m = await mailer();
  if (!m) return { sent: false, reason: "smtp" as const };

  const to =
    convention.student.email?.trim() ||
    convention.parentSignerEmail?.trim() ||
    convention.student.parentEmail?.trim();
  if (!to) return { sent: false, reason: "no_recipients" as const };

  const bundle = await loadAppConfig();
  const school = bundle.identity.shortName || bundle.identity.name;
  const link = convention.studentAccessToken ? studentLink(convention.studentAccessToken) : null;

  const text = [
    "Bonjour,",
    "",
    `La préconvention de stage de ${studentLabel(convention)} doit être corrigée.`,
    note ? `Motif : ${note}` : null,
    link ? `Lien pour modifier : ${link}` : null,
    "",
    "Cordialement,",
    school,
  ]
    .filter(Boolean)
    .join("\n");

  await m.transporter.sendMail({
    from: `"Stages ${school}" <${m.smtp.user}>`,
    to,
    subject: `[Stages] Préconvention à corriger — ${studentLabel(convention)}`,
    text,
  });
  return { sent: true, recipients: [to] };
}

export async function notifyStageSignatureRequest(
  convention: StageConvention,
  signature: StageSignature,
) {
  const m = await mailer();
  if (!m) return { sent: false, reason: "smtp" as const };

  const to = signature.signEmail?.trim();
  if (!to || !signature.signToken) return { sent: false, reason: "no_email" as const };

  const bundle = await loadAppConfig();
  const school = bundle.identity.shortName || bundle.identity.name;
  const roleLabel = STAGE_SIGNER_ROLE_LABELS[signature.role];
  const link = signLink(signature.signToken);

  const text = [
    "Bonjour,",
    "",
    `Une convention de stage concernant ${studentLabel(convention)} (${convention.student.className}) requiert votre signature en tant que ${roleLabel}.`,
    "",
    `Entreprise : ${convention.company.name}`,
    `Période : ${convention.schedule.periodStart} → ${convention.schedule.periodEnd}`,
    `Horaires : ${scheduleSummary(convention.schedule)}`,
    "",
    "Pour signer électroniquement :",
    link,
    "",
    "Cordialement,",
    school,
  ].join("\n");

  await m.transporter.sendMail({
    from: `"Stages ${school}" <${m.smtp.user}>`,
    to,
    subject: `[Stages] Signature requise — ${studentLabel(convention)}`,
    text,
  });
  return { sent: true, recipients: [to] };
}

export async function notifyAllStageSignatureRequests(convention: StageConvention) {
  const results: Array<{ role: string; sent: boolean; reason?: string }> = [];
  for (const sig of convention.signatures) {
    if (sig.status !== "en_attente") continue;
    const r = await notifyStageSignatureRequest(convention, sig);
    results.push({
      role: sig.role,
      sent: r.sent,
      reason: !r.sent && "reason" in r ? String(r.reason) : undefined,
    });
  }
  const sentCount = results.filter((r) => r.sent).length;
  return { sentCount, total: results.length, results };
}

export async function notifyStageFullySigned(convention: StageConvention) {
  const m = await mailer();
  if (!m) return { sent: false, reason: "smtp" as const };

  const recipients = await resolveStagesAdminEmails();
  if (!recipients.length) return { sent: false, reason: "no_recipients" as const };

  const bundle = await loadAppConfig();
  const school = bundle.identity.shortName || bundle.identity.name;

  const text = [
    "Bonjour,",
    "",
    `Toutes les signatures ont été recueillies pour la convention de stage de ${studentLabel(convention)}.`,
    "",
    `Entreprise : ${convention.company.name}`,
    `Statut : ${STAGE_CONVENTION_STATUS_LABELS.signed}`,
    "",
    "Vous pouvez télécharger le PDF depuis le module Stages & conventions.",
    "",
    "Cordialement,",
    school,
  ].join("\n");

  for (const to of recipients) {
    await m.transporter.sendMail({
      from: `"Stages ${school}" <${m.smtp.user}>`,
      to,
      subject: `[Stages] Convention signée — ${studentLabel(convention)}`,
      text,
    });
  }
  return { sent: true, recipients };
}

import "server-only";

import { PLATFORM_ASSISTANCE_EMAIL } from "@/app/lib/platform-assistance-email";
import { getTenant } from "@/app/lib/tenant-context";
import type { MicrosoftLicenseRequest } from "@/app/lib/microsoft-license-types";
import { createTenantTransporter, getTenantSmtpFromAddress } from "@/app/lib/tenant-mail";

function resellerEmail(): string | null {
  return process.env.MICROSOFT_RESELLER_EMAIL?.trim() || null;
}

function peopleTable(req: MicrosoftLicenseRequest): string {
  const rows = req.people
    .map(
      (p) =>
        `<tr><td>${p.lastName}</td><td>${p.firstName}</td><td>${p.email}</td><td>${p.jobRole}</td><td>${p.licenseType}</td></tr>`,
    )
    .join("");
  return `<table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>Nom</th><th>Prénom</th><th>E-mail</th><th>Fonction</th><th>Licence</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function peopleText(req: MicrosoftLicenseRequest): string {
  return req.people
    .map(
      (p) =>
        `- ${p.lastName} ${p.firstName} <${p.email}> — ${p.jobRole} — ${p.licenseType}`,
    )
    .join("\n");
}

export async function emailMicrosoftLicenseRequest(req: MicrosoftLicenseRequest): Promise<void> {
  const transporter = await createTenantTransporter();
  if (!transporter) {
    console.warn("[microsoft-license-email] SMTP non configuré — e-mail non envoyé");
    return;
  }

  let tenantLabel = req.establishmentName || "Établissement";
  let tenantSlug = "";
  try {
    const tenant = await getTenant();
    tenantLabel = req.establishmentName || tenant.label || tenant.slug;
    tenantSlug = tenant.slug;
  } catch {
    /* hors contexte tenant */
  }

  const subject = `[Scola] Demande licences Microsoft — ${tenantLabel}`;
  const text = `Demande de licences Microsoft 365 Education

Établissement : ${tenantLabel}${tenantSlug ? ` (${tenantSlug})` : ""}
Soumis le : ${req.submittedAt}
Référent : ${req.submittedBy || "—"}

Personnes :
${peopleText(req)}

${req.notes ? `Notes : ${req.notes}\n` : ""}`;

  const html = `<p><strong>Demande de licences Microsoft 365 Education</strong></p>
<p>Établissement : <strong>${tenantLabel}</strong>${tenantSlug ? ` (${tenantSlug})` : ""}<br/>
Soumis le : ${req.submittedAt}<br/>
Référent : ${req.submittedBy || "—"}</p>
${peopleTable(req)}
${req.notes ? `<p>Notes : ${req.notes}</p>` : ""}`;

  const fromAddr = (await getTenantSmtpFromAddress()) || process.env.SMTP_USER?.trim();
  if (!fromAddr) return;

  const recipients = [PLATFORM_ASSISTANCE_EMAIL];
  const reseller = resellerEmail();
  if (reseller && !recipients.includes(reseller)) recipients.push(reseller);

  await transporter.sendMail({
    from: fromAddr,
    to: recipients.join(", "),
    subject,
    text,
    html,
  });
}

import { loadAppConfig } from "@/app/lib/app-config";
import { establishmentLabels } from "@/app/lib/covoiturage-matching";
import type { CovoiturageMatch, CovoiturageProfile } from "@/app/lib/covoiturage-types";
import { createTenantTransporter, getTenantSmtpConfig } from "@/app/lib/tenant-mail";
import { tenantAbsolutePath } from "@/app/lib/tenant-context";

async function getMailer() {
  const smtp = await getTenantSmtpConfig();
  if (!smtp) return null;
  const transporter = await createTenantTransporter();
  if (!transporter) return null;
  return { smtp, transporter };
}

export async function notifyCovoiturageMatchPotential(params: {
  profile: CovoiturageProfile;
  match: CovoiturageMatch;
}): Promise<{ sent: boolean; reason?: string }> {
  const mailer = await getMailer();
  if (!mailer) return { sent: false, reason: "smtp_unavailable" };

  const bundle = await loadAppConfig();
  const estLabels = establishmentLabels(params.match.matchedEstablishments, bundle.establishments);
  const link = await tenantAbsolutePath("/covoiturage");

  const subject = "Covoiturage — une famille correspond à votre recherche";
  const text = [
    `Bonjour ${params.profile.displayName},`,
    "",
    "Une autre famille inscrite au service de covoiturage recherche également un trajet partagé :",
    `• Zone : code postal ${params.match.matchedZone}`,
    `• Établissement(s) : ${estLabels}`,
    "",
    "Pour protéger votre vie privée, aucune coordonnée n'est communiquée tant que vous n'avez pas accepté l'échange.",
    "",
    `Connectez-vous pour répondre : ${link}`,
    "",
    "Si vous avez déjà trouvé votre covoiturage, marquez votre profil comme « complet » pour ne plus recevoir de propositions.",
    "",
    bundle.identity.shortName,
  ].join("\n");

  await mailer.transporter.sendMail({
    from: `"Covoiturage ${bundle.identity.shortName}" <${mailer.smtp.user}>`,
    to: params.profile.email,
    subject,
    text,
  });

  return { sent: true };
}

export async function notifyCovoiturageContactRevealed(params: {
  profile: CovoiturageProfile;
  other: CovoiturageProfile;
  match: CovoiturageMatch;
}): Promise<{ sent: boolean; reason?: string }> {
  const mailer = await getMailer();
  if (!mailer) return { sent: false, reason: "smtp_unavailable" };

  const bundle = await loadAppConfig();
  const estLabels = establishmentLabels(params.match.matchedEstablishments, bundle.establishments);

  const subject = "Covoiturage — mise en relation confirmée";
  const text = [
    `Bonjour ${params.profile.displayName},`,
    "",
    "Vous et une autre famille avez accepté de vous mettre en relation pour un covoiturage :",
    `• Zone : code postal ${params.match.matchedZone}`,
    `• Établissement(s) : ${estLabels}`,
    "",
    "Coordonnées de l'autre famille :",
    `• ${params.other.displayName}`,
    `• ${params.other.email}`,
    "",
    "Vous pouvez désormais échanger directement par e-mail pour organiser le trajet.",
    "L'établissement ne gère pas les arrangements de covoiturage : ils relèvent de la responsabilité des familles.",
    "",
    bundle.identity.shortName,
  ].join("\n");

  await mailer.transporter.sendMail({
    from: `"Covoiturage ${bundle.identity.shortName}" <${mailer.smtp.user}>`,
    to: params.profile.email,
    subject,
    text,
  });

  return { sent: true };
}

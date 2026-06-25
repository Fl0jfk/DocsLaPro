import "server-only";

import { createTenantTransporter, getTenantSmtpFromAddress } from "@/app/lib/tenant-mail";
import { tenantAbsolutePath } from "@/app/lib/tenant-context";
import type { BienEtreConfig, BienEtreSignalement } from "@/app/lib/bien-etre-types";

export async function notifyPsychologistSignalement(
  config: BienEtreConfig,
  signalement: BienEtreSignalement,
): Promise<void> {
  const to = config.psychologistEmail.trim();
  if (!to) throw new Error("E-mail psychologue non configuré.");

  const transporter = await createTenantTransporter();
  if (!transporter) throw new Error("SMTP non configuré pour ce tenant.");

  const defaultFrom = await getTenantSmtpFromAddress();
  const from = config.notificationFromEmail?.trim() || defaultFrom;
  if (!from) throw new Error("Adresse expéditrice SMTP manquante.");

  const link = await tenantAbsolutePath(`/bien-etre/referent?id=${encodeURIComponent(signalement.id)}`);
  const categories = signalement.categories.length ? signalement.categories.join(", ") : "—";
  const classe = signalement.classe?.trim() || "—";

  await transporter.sendMail({
    from,
    to,
    subject: `[Bien-être] Signalement — ${signalement.prenom}`,
    text: [
      "Nouveau signalement bien-être",
      "",
      `Prénom : ${signalement.prenom}`,
      `Classe / niveau : ${classe}`,
      `Gravité : ${signalement.severity}`,
      `Catégories : ${categories}`,
      "",
      "Résumé :",
      signalement.summary,
      "",
      signalement.complement ? `Message complémentaire :\n${signalement.complement}` : "",
      "",
      `Voir dans Scola : ${link}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

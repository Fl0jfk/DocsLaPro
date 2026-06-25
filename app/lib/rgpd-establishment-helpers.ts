import type { RgpdQuestionnaireAnswers } from "@/app/lib/rgpd-types";

export function rgpdEstablishmentDisplayName(
  answers: RgpdQuestionnaireAnswers,
  configLabel?: string,
): string {
  return (
    answers.establishmentIdentity?.legalName?.trim() ||
    configLabel ||
    "Établissement scolaire"
  );
}

export function rgpdCoordinatorLine(answers: RgpdQuestionnaireAnswers): string {
  const id = answers.establishmentIdentity;
  const parts: string[] = [];
  if (id?.coordinatorName) parts.push(id.coordinatorName);
  if (id?.coordinatorTitle) parts.push(id.coordinatorTitle);
  if (parts.length) return parts.join(" — ");
  return answers.directionReferent || "Chef d'établissement coordinateur";
}

export function rgpdDpoBlock(answers: RgpdQuestionnaireAnswers): string[] {
  const id = answers.establishmentIdentity;
  const lines: string[] = [];
  if (answers.dpdDesignated && answers.dpdInternal && answers.dpdName) {
    lines.push(`DPD interne : ${answers.dpdName}${answers.dpdEmail ? ` (${answers.dpdEmail})` : ""}`);
  }
  if (id?.dpoDesignatedBy) lines.push(`Désigné par : ${id.dpoDesignatedBy}`);
  if (id?.dpoExternalContact) lines.push(`Contact : ${id.dpoExternalContact}`);
  if (id?.dpoExternalEmail) lines.push(`E-mail : ${id.dpoExternalEmail}`);
  else if (!answers.dpdInternal && answers.dpdEmail) lines.push(`E-mail : ${answers.dpdEmail}`);
  if (!lines.length) lines.push("DPD : [À compléter — réseau diocésain / FNOGEC / autre]");
  return lines;
}

export function rgpdEffectifLine(answers: RgpdQuestionnaireAnswers): string {
  const s = answers.studentCount;
  const t = answers.teacherCount;
  const p = answers.staffCount;
  const parts: string[] = [];
  if (s) parts.push(`environ ${s} élèves`);
  if (t || p) {
    const staff = [t ? `${t} enseignants` : null, p ? `${p} personnels hors enseignants` : null]
      .filter(Boolean)
      .join(" + ");
    if (staff) parts.push(`environ ${t && p ? t + p : t || p} personnels (${staff})`);
  }
  return parts.length ? parts.join(" — ") : "[À compléter]";
}

export function rgpdEntLabel(answers: RgpdQuestionnaireAnswers): string {
  const id = answers.establishmentIdentity;
  const products = id?.entProducts?.trim() || answers.subprocessors.entName?.trim();
  if (products) return products;
  return "[Logiciel / ENT à préciser]";
}

export function rgpdEntSecondaryLabel(answers: RgpdQuestionnaireAnswers): string | undefined {
  return answers.establishmentIdentity?.secondaryEntProducts?.trim() || undefined;
}

/** Libellé complet pour fiche 1 : ENT principal et/ou complémentaire */
export function rgpdEntFullLabel(answers: RgpdQuestionnaireAnswers): string {
  const primary = rgpdEntLabel(answers);
  const secondary = rgpdEntSecondaryLabel(answers);
  if (secondary && secondary !== primary) {
    return `${primary} et/ou ${secondary}`;
  }
  return primary;
}

export function rgpdEntEditor(answers: RgpdQuestionnaireAnswers): string {
  return answers.establishmentIdentity?.entEditor?.trim() || "[Éditeur / hébergeur à préciser]";
}

import nodemailer from "nodemailer";
import { loadAppConfig } from "@/app/lib/app-config";
import {
  outingDateTimeLabel,
  participantsForEtab,
} from "@/app/lib/internat-outing";
import type { InternatRollCallRecipients } from "@/app/lib/internat-types";
import { studentDisplayName } from "@/app/lib/internat-types";
import type { InternatOuting, InternatRollCall, InternatStudent } from "@/app/lib/internat-types";
import { rollCallAbsentStudents, rollCallStudentsByMark } from "@/app/lib/internat-stats";
import { INTERNAT_ROLL_MARK_LABELS } from "@/app/lib/internat-types";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
}

function getMailer() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function parseRollCallRecipients(raw: InternatRollCallRecipients | undefined) {
  const emails = new Set<string>();
  for (const v of [raw?.directionLycee, raw?.cpeLycee, raw?.cpeCollege]) {
    const e = String(v || "").trim();
    if (e) emails.add(e);
  }
  return [...emails];
}

export async function notifyInternatRollCallValidated(params: {
  rollCall: InternatRollCall;
  students: InternatStudent[];
  validatedBy: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[internat-notify] SMTP non configuré.");
    return { sent: false, reason: "smtp" };
  }

  const bundle = await loadAppConfig();
  const notif = bundle.notifications as typeof bundle.notifications & {
    internatRollCallRecipients?: InternatRollCallRecipients;
  };
  const recipients = parseRollCallRecipients(notif.internatRollCallRecipients);
  if (recipients.length === 0) {
    const lyceeDir = bundle.establishments.find((e) => e.id === "lycee")?.directorEmail;
    if (lyceeDir) recipients.push(lyceeDir);
  }
  if (recipients.length === 0) {
    console.warn("[internat-notify] Aucun destinataire appel internat.");
    return { sent: false, reason: "no_recipients" };
  }

  const active = params.students.filter((s) => s.actif);
  const presentBoys = active.filter(
    (s) =>
      s.sexe === "M" &&
      (params.rollCall.boys.marks[s.id] === "present" || params.rollCall.boys.marks[s.id] === "activite"),
  );
  const presentGirls = active.filter(
    (s) =>
      s.sexe === "F" &&
      (params.rollCall.girls.marks[s.id] === "present" || params.rollCall.girls.marks[s.id] === "activite"),
  );
  const absents = rollCallAbsentStudents(params.rollCall, params.students);
  const absentsCollege = absents.filter((a) => a.student.etablissement === "Collège");
  const absentsLycee = absents.filter((a) => a.student.etablissement === "Lycée");
  const activities = rollCallStudentsByMark(params.rollCall, params.students, "activite");
  const activitiesCollege = activities.filter((a) => a.student.etablissement === "Collège");
  const activitiesLycee = activities.filter((a) => a.student.etablissement === "Lycée");

  const link = appUrl() ? `${appUrl()}/gestion-internat?tab=appel` : "/gestion-internat?tab=appel";
  const dateLabel = new Date(params.rollCall.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const text = [
    "Bonjour,",
    "",
    `L'appel du soir de l'internat du ${dateLabel} a été validé par ${params.validatedBy}.`,
    "",
    `Présents : ${presentBoys.length} garçon(s), ${presentGirls.length} fille(s).`,
    "",
    activitiesCollege.length
      ? `Activité extérieure — Collège :\n${activitiesCollege.map((a) => `• ${studentDisplayName(a.student)}`).join("\n")}`
      : null,
    activitiesLycee.length
      ? `Activité extérieure — Lycée :\n${activitiesLycee.map((a) => `• ${studentDisplayName(a.student)}`).join("\n")}`
      : null,
    "",
    absentsCollege.length
      ? `Absents / excusés — Collège :\n${absentsCollege.map((a) => `• ${studentDisplayName(a.student)} — ${INTERNAT_ROLL_MARK_LABELS[a.mark]}`).join("\n")}`
      : "Aucun absent collège.",
    "",
    absentsLycee.length
      ? `Absents / excusés — Lycée :\n${absentsLycee.map((a) => `• ${studentDisplayName(a.student)} — ${INTERNAT_ROLL_MARK_LABELS[a.mark]}`).join("\n")}`
      : "Aucun absent lycée.",
    "",
    `Consulter le détail : ${link}`,
    "",
    "Cordialement,",
    bundle.identity.shortName || bundle.identity.name,
  ].join("\n");

  await getMailer().sendMail({
    from: `"Internat ${bundle.identity.shortName || "La Providence"}" <${process.env.SMTP_USER}>`,
    to: recipients.join(", "),
    subject: `Appel internat — ${params.rollCall.date}`,
    text,
  });

  return { sent: true, recipients };
}

export async function notifyInternatEmergency(params: {
  message: string;
  severity: string;
  location?: string;
  createdBy: string;
  studentNames?: string[];
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[internat-notify] SMTP non configuré.");
    return { sent: false, reason: "smtp" };
  }

  const bundle = await loadAppConfig();
  const notif = bundle.notifications as typeof bundle.notifications & {
    internatEmergencyRecipients?: string[];
  };
  const recipients = (notif.internatEmergencyRecipients || []).filter(Boolean);
  if (recipients.length === 0) {
    console.warn("[internat-notify] Aucun destinataire urgence internat.");
    return { sent: false, reason: "no_recipients" };
  }

  const text = [
    "ALERTE INTERNAT",
    "",
    `Gravité : ${params.severity}`,
    `Signalée par : ${params.createdBy}`,
    params.location ? `Lieu : ${params.location}` : null,
    "",
    params.message,
    "",
    params.studentNames?.length ? `Élèves concernés :\n${params.studentNames.map((n) => `• ${n}`).join("\n")}` : null,
    "",
    `Heure : ${new Date().toLocaleString("fr-FR")}`,
  ]
    .filter(Boolean)
    .join("\n");

  await getMailer().sendMail({
    from: `"ALERTE INTERNAT" <${process.env.SMTP_USER}>`,
    to: recipients.join(", "),
    subject: `ALERTE INTERNAT — ${params.severity}`,
    text,
  });

  return { sent: true, recipients };
}

export async function notifyInternatRollCallIncomplete(params: {
  rollCall: InternatRollCall;
  students: InternatStudent[];
  markedCount: number;
  totalCount: number;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[internat-notify] SMTP non configuré.");
    return { sent: false, reason: "smtp" };
  }

  const bundle = await loadAppConfig();
  const notif = bundle.notifications as typeof bundle.notifications & {
    internatRollCallRecipients?: InternatRollCallRecipients;
  };
  const recipients = parseRollCallRecipients(notif.internatRollCallRecipients);
  if (recipients.length === 0) {
    const lyceeDir = bundle.establishments.find((e) => e.id === "lycee")?.directorEmail;
    if (lyceeDir) recipients.push(lyceeDir);
  }
  if (recipients.length === 0) {
    return { sent: false, reason: "no_recipients" };
  }

  const link = appUrl() ? `${appUrl()}/gestion-internat?tab=appel` : "/gestion-internat?tab=appel";
  const dateLabel = new Date(params.rollCall.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const boysDone = params.rollCall.boys.completed;
  const girlsDone = params.rollCall.girls.completed;

  const text = [
    "Bonjour,",
    "",
    `L'appel du soir de l'internat du ${dateLabel} n'a pas encore été finalisé.`,
    "",
    `Progression : ${params.markedCount}/${params.totalCount} interne(s) marqué(s).`,
    `Section garçons : ${boysDone ? "terminée" : "en cours ou non démarrée"}.`,
    `Section filles : ${girlsDone ? "terminée" : "en cours ou non démarrée"}.`,
    "",
    "Les marquages en cours sont déjà enregistrés — il reste à terminer les sections puis à valider l'appel.",
    "",
    `Reprendre l'appel : ${link}`,
    "",
    "Cordialement,",
    bundle.identity.shortName || bundle.identity.name,
  ].join("\n");

  await getMailer().sendMail({
    from: `"Internat ${bundle.identity.shortName || "La Providence"}" <${process.env.SMTP_USER}>`,
    to: recipients.join(", "),
    subject: `[Internat] Appel du soir non finalisé — ${params.rollCall.date}`,
    text,
  });

  return { sent: true, recipients };
}

function outingAuthUrl(token: string) {
  const base = appUrl();
  return base
    ? `${base}/internat/autorisation?token=${encodeURIComponent(token)}`
    : `/internat/autorisation?token=${encodeURIComponent(token)}`;
}

export async function notifyInternatOutingDirection(params: {
  outing: InternatOuting;
  decisionIndex: number;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[internat-notify] SMTP non configuré.");
    return { sent: false, reason: "smtp" };
  }

  const bundle = await loadAppConfig();
  const decision = params.outing.directionDecisions[params.decisionIndex];
  if (!decision?.directorEmail) {
    return { sent: false, reason: "no_recipients" };
  }

  const students = participantsForEtab(params.outing, decision.etablissement);
  const link = outingAuthUrl(decision.token);
  const dateLabel = outingDateTimeLabel(params.outing);

  const text = [
    "Bonjour,",
    "",
    `Une sortie d'interne est proposée pour des élèves de votre établissement (${decision.etablissement}).`,
    "",
    `Activité : ${params.outing.activity}`,
    params.outing.destination ? `Lieu : ${params.outing.destination}` : null,
    `Date : ${dateLabel}`,
    `Accompagnement : ${params.outing.accompanists}`,
    "",
    "Élèves concernés :",
    ...students.map((s) => `• ${s.studentName} (${s.classe})`),
    "",
    "Merci de valider ou refuser cette sortie via le lien sécurisé ci-dessous :",
    link,
    "",
    "Cordialement,",
    bundle.identity.shortName || bundle.identity.name,
  ]
    .filter(Boolean)
    .join("\n");

  await getMailer().sendMail({
    from: `"Internat ${bundle.identity.shortName || "La Providence"}" <${process.env.SMTP_USER}>`,
    to: decision.directorEmail,
    subject: `[Internat] Validation sortie — ${params.outing.title}`,
    text,
  });

  return { sent: true, recipients: [decision.directorEmail] };
}

export async function notifyInternatOutingParents(params: { outing: InternatOuting; participantIndex: number }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[internat-notify] SMTP non configuré.");
    return { sent: false, reason: "smtp" };
  }

  const bundle = await loadAppConfig();
  const p = params.outing.participants[params.participantIndex];
  if (!p) return { sent: false, reason: "no_participant" };

  const emails = [p.parent1Email, p.parent2Email].filter(Boolean) as string[];
  if (emails.length === 0) return { sent: false, reason: "no_recipients" };

  const link = outingAuthUrl(p.parentToken);
  const dateLabel = outingDateTimeLabel(params.outing);

  const text = [
    "Bonjour,",
    "",
    `Une sortie est proposée pour votre enfant ${p.studentName} (${p.classe}).`,
    "",
    `Activité : ${params.outing.activity}`,
    params.outing.destination ? `Lieu : ${params.outing.destination}` : null,
    `Date : ${dateLabel}`,
    `Accompagnement : ${params.outing.accompanists}`,
    "",
    "En cliquant sur « J'autorise » dans le lien ci-dessous, vous confirmez être le représentant légal de cet élève et autoriser sa participation à cette sortie.",
    "",
    link,
    "",
    "Cordialement,",
    bundle.identity.shortName || bundle.identity.name,
  ]
    .filter(Boolean)
    .join("\n");

  await getMailer().sendMail({
    from: `"Internat ${bundle.identity.shortName || "La Providence"}" <${process.env.SMTP_USER}>`,
    to: emails.join(", "),
    subject: `[Internat] Autorisation de sortie — ${p.studentName}`,
    text,
  });

  return { sent: true, recipients: emails };
}

export type ParentWeeklyDigestLine = {
  studentName: string;
  date: string;
  title: string;
  activity: string;
  destination?: string;
  timeLabel: string;
  statusLabel: string;
};

export async function sendInternatWeeklyParentDigest(params: {
  linesByEmail: Map<string, ParentWeeklyDigestLine[]>;
  weekLabel: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[internat-notify] SMTP non configuré.");
    return { sent: false, reason: "smtp", count: 0 };
  }
  if (params.linesByEmail.size === 0) {
    return { sent: true, count: 0, skipped: "empty" };
  }

  const bundle = await loadAppConfig();
  let count = 0;

  for (const [email, lines] of params.linesByEmail) {
    const sorted = [...lines].sort((a, b) => a.date.localeCompare(b.date));
    const text = [
      "Bonjour,",
      "",
      `Voici les sorties et activités prévues à l'internat pour la semaine du ${params.weekLabel} concernant votre/vos enfant(s) :`,
      "",
      ...sorted.flatMap((line) => [
        `• ${line.studentName} — ${new Date(line.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`,
        `  ${line.title} : ${line.activity}`,
        line.destination ? `  Lieu : ${line.destination}` : null,
        `  Horaires : ${line.timeLabel}`,
        `  Statut : ${line.statusLabel}`,
        "",
      ]),
      "Pour les sorties en attente de votre accord, consultez l'e-mail d'autorisation reçu séparément.",
      "",
      "Cordialement,",
      bundle.identity.shortName || bundle.identity.name,
    ]
      .filter(Boolean)
      .join("\n");

    await getMailer().sendMail({
      from: `"Internat ${bundle.identity.shortName || "La Providence"}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `[Internat] Sorties prévues — semaine du ${params.weekLabel}`,
      text,
    });
    count += 1;
  }

  return { sent: true, count };
}

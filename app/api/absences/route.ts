import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import nodemailer from "nodemailer";
import { loadTenantConfig, getEstablishmentByLabel } from "@/app/lib/tenant-config";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { getTenantJson, putTenantJson } from "@/app/lib/tenant-s3-storage";
import { tenantS3Key } from "@/app/lib/tenant";
import { getBucketName, getTenantS3Client } from "@/app/lib/tenant-s3-storage";
import { formatAbsencePeriod, normalizeAbsencePeriodInput, type AbsencePeriodType } from "@/app/lib/absence-period";
import {
  formatHoursTreatmentCreatorMailLine,
  formatHoursTreatmentMailLine,
  validateHoursTreatmentForAbsence,
  type AbsenceHoursTreatment,
} from "@/app/lib/absence-hours-treatment";

type AbsenceScope = "professeur" | "ogec";
type Etablissement = "École" | "Collège" | "Lycée";
type AbsenceWorkflowStatus = "OUVERTE" | "JUSTIFICATIF_DEPOSE" | "CLOTUREE";
type AbsenceDecision = "EN_ATTENTE" | "VALIDEE" | "REFUSEE";

type AbsenceRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    userId: string;
    name: string;
    email: string;
    roles: string[];
  };
  data: {
    scope: AbsenceScope;
    etablissement: Etablissement | null;
    periodType?: AbsencePeriodType | null;
    startDate: string;
    endDate: string;
    startTime?: string | null;
    endTime?: string | null;
    reason: string;
    details: string;
  };
  workflowStatus: AbsenceWorkflowStatus;
  managerDecision: AbsenceDecision;
  closedAt?: string | null;
  justification?: {
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null;
  managerNote?: string;
  /** À la discrétion de la direction lors de la validation. */
  hoursTreatment?: AbsenceHoursTreatment | null;
  /** Date de la dernière relance direction pour un justificatif (facultatif). */
  justificatifRelanceAt?: string | null;
  history: Array<{
    at: string;
    by: string;
    action: string;
    note?: string;
  }>;
};

const INDEX_KEY = "absences/index.json";

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, "");

function hasRole(roles: string[], matcher: string) {
  const m = norm(matcher);
  return roles.some((r) => norm(r).includes(m));
}

function isTeacherRole(roles: string[]) {
  return roles.some((r) => norm(r).includes("professeur"));
}

function getRoleFlags(roles: string[]) {
  return {
    isDirectionEcole: hasRole(roles, "directionecole"),
    isDirectionCollege: hasRole(roles, "directioncollege"),
    isDirectionLycee: hasRole(roles, "directionlycee"),
    isCompta: hasRole(roles, "comptabilite"),
    isAdministratif: hasRole(roles, "administratif"),
    isEducation: hasRole(roles, "education"),
  };
}

function canViewAbsence(abs: AbsenceRecord, viewerUserId: string, roles: string[]) {
  if (abs.createdBy.userId === viewerUserId) return true;
  const flags = getRoleFlags(roles);
  if (abs.data.scope === "ogec") {
    return flags.isDirectionEcole || flags.isDirectionCollege || flags.isDirectionLycee || flags.isCompta;
  }
  // Administratif / Vie scolaire: accès lecture aux absences professeurs (pour le planning)
  if (flags.isAdministratif || flags.isEducation) return true;
  // Direction lycée: vue globale des absences professeurs
  if (flags.isDirectionLycee) return true;
  if (abs.data.etablissement === "École") return flags.isDirectionEcole;
  if (abs.data.etablissement === "Collège") return flags.isDirectionCollege;
  if (abs.data.etablissement === "Lycée") return flags.isDirectionLycee;
  return false;
}

function canManageAbsence(abs: AbsenceRecord, roles: string[]) {
  const flags = getRoleFlags(roles);
  if (abs.data.scope === "ogec") {
    // Pour le personnel OGEC: validation uniquement par direction lycée
    return flags.isDirectionLycee;
  }
  if (abs.data.etablissement === "École") return flags.isDirectionEcole;
  if (abs.data.etablissement === "Collège") return flags.isDirectionCollege;
  if (abs.data.etablissement === "Lycée") return flags.isDirectionLycee;
  return false;
}

async function resolveDecisionTarget(
  orgId: string,
  scope: AbsenceScope,
  etablissement: Etablissement | null,
) {
  const bundle = await loadTenantConfig(orgId);
  if (scope === "ogec") {
    const lycee = bundle.establishments.find((e) => e.id === "lycee") || bundle.establishments[bundle.establishments.length - 1];
    return {
      roleLabel: lycee ? `Direction ${lycee.label}` : "Direction",
      name: lycee?.directorName || bundle.identity.name,
      email: lycee?.directorEmail || "",
    };
  }
  const est = etablissement ? getEstablishmentByLabel(bundle, etablissement) : null;
  if (est) {
    return {
      roleLabel: `Direction ${est.label}`,
      name: est.directorName || est.label,
      email: est.directorEmail || "",
    };
  }
  return { roleLabel: "Direction", name: bundle.identity.name, email: "" };
}

function getMailer() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function formatDateFR(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function getIndex(orgId: string): Promise<AbsenceRecord[]> {
  const hit = await getTenantJson<AbsenceRecord[]>(orgId, INDEX_KEY);
  return hit?.data ?? [];
}

async function saveIndex(orgId: string, index: AbsenceRecord[]) {
  await putTenantJson(orgId, INDEX_KEY, index);
}

function parseDateOnly(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function purgeExpiredAbsences(orgId: string, index: AbsenceRecord[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const keep: AbsenceRecord[] = [];
  const remove: AbsenceRecord[] = [];

  for (const rec of index) {
    const end = parseDateOnly(rec?.data?.endDate || "");
    if (!end) {
      keep.push(rec);
      continue;
    }
    if (end < today) remove.push(rec);
    else keep.push(rec);
  }

  if (remove.length === 0) return keep;

  const bucket = getBucketName();
  for (const rec of remove) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: tenantS3Key(orgId, `absences/${rec.id}.json`),
        }),
      );
    } catch (e) {
      console.error(`Absences RGPD purge error (${rec.id}):`, e);
    }
  }

  await saveIndex(orgId, keep);
  return keep;
}

async function resolveValidationRecipients(orgId: string, record: AbsenceRecord) {
  const n = (await loadTenantConfig(orgId)).notifications;
  if (record.data.scope === "ogec") {
    return [...n.absencesNotifyOgecCompta].filter(Boolean);
  }
  if (record.data.etablissement === "École") {
    return n.absencesNotifyProfEcole?.email ? [n.absencesNotifyProfEcole.email] : [];
  }
  return n.absencesNotifyProfCollegeLycee?.email ? [n.absencesNotifyProfCollegeLycee.email] : [];
}

export async function GET() {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.ctx;
  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];

  try {
    const rawIndex = await getIndex(orgId);
    const index = await purgeExpiredAbsences(orgId, rawIndex);
    const visible = index
      .filter((a) => canViewAbsence(a, userId, roles))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return NextResponse.json(visible);
  } catch (error) {
    console.error("Absences list error:", error);
    return NextResponse.json({ error: "Erreur récupération absences" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.ctx;
  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];

  try {
    const body = await req.json();
    const payload = body?.data || {};

    // Scope is enforced by Clerk roles:
    // professeur => "professeur", other roles => "ogec"
    const scope: AbsenceScope = isTeacherRole(roles) ? "professeur" : "ogec";
    const etablissement: Etablissement | null = payload.etablissement || null;
    const periodResult = normalizeAbsencePeriodInput({
      periodType: payload.periodType,
      startDate: payload.startDate,
      endDate: payload.endDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
    });
    if (periodResult.error || !periodResult.data) {
      return NextResponse.json({ error: periodResult.error || "Période invalide." }, { status: 400 });
    }
    const period = periodResult.data;
    const reason = String(payload.reason || "").trim();
    const details = String(payload.details || "").trim();
    const justificationPayload = payload?.justification || null;

    if (!reason) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }
    if (scope === "professeur" && !etablissement) {
      return NextResponse.json({ error: "Établissement requis pour une absence professeur." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const creatorName = user?.fullName || user?.firstName || "Utilisateur";
    const creatorEmail = user?.primaryEmailAddress?.emailAddress || "";

    const record: AbsenceRecord = {
      id,
      createdAt: now,
      updatedAt: now,
      createdBy: {
        userId,
        name: creatorName,
        email: creatorEmail,
        roles,
      },
      data: {
        scope,
        etablissement: scope === "ogec" ? null : etablissement,
        periodType: period.periodType,
        startDate: period.startDate,
        endDate: period.endDate,
        startTime: period.startTime ?? null,
        endTime: period.endTime ?? null,
        reason,
        details,
      },
      workflowStatus: justificationPayload?.fileName && justificationPayload?.fileUrl ? "JUSTIFICATIF_DEPOSE" : "OUVERTE",
      managerDecision: "EN_ATTENTE",
      closedAt: null,
      justificatifRelanceAt: null,
      justification:
        justificationPayload?.fileName && justificationPayload?.fileUrl
          ? {
              fileName: String(justificationPayload.fileName),
              fileUrl: String(justificationPayload.fileUrl),
              uploadedAt: now,
              uploadedBy: creatorName,
            }
          : null,
      history: [
        {
          at: now,
          by: creatorName,
          action: "CREATION",
          note: "Déclaration d'absence créée",
        },
        ...(justificationPayload?.fileName && justificationPayload?.fileUrl
          ? [
              {
                at: now,
                by: creatorName,
                action: "JUSTIFICATIF_DEPOSE",
                note: "Justificatif ajouté à la création",
              },
            ]
          : []),
      ],
    };

    await putTenantJson(orgId, `absences/${id}.json`, record);

    const rawIndex = await getIndex(orgId);
    const index = await purgeExpiredAbsences(orgId, rawIndex);
    index.push(record);
    await saveIndex(orgId, index);

    try {
      const target = await resolveDecisionTarget(orgId, scope, scope === "ogec" ? null : etablissement);
      const transporter = getMailer();
      await transporter.sendMail({
        from: `"Absences" <${process.env.SMTP_USER}>`,
        to: target.email,
        subject: `Nouvelle absence à traiter — ${scope === "ogec" ? "Personnel OGEC" : `Professeur ${etablissement || ""}`}`.trim(),
        text: [
          `Bonjour ${target.name},`,
          ``,
          `Une nouvelle absence a été déclarée et nécessite votre décision.`,
          ``,
          `Type : ${scope === "ogec" ? "Personnel OGEC" : "Professeur"}`,
          `Établissement : ${scope === "ogec" ? "OGEC" : etablissement || "—"}`,
          `Créateur : ${creatorName} (${creatorEmail || "email non renseigné"})`,
          `Période : ${formatAbsencePeriod(record.data)}`,
          `Motif : ${reason}`,
          details ? `Détails : ${details}` : "",
          justificationPayload?.fileName ? `Justificatif fourni : ${justificationPayload.fileName}` : `Justificatif : en attente`,
          ``,
          `Action attendue : Valider / Refuser / Relancer justificatif`,
          ``,
          `Espace Absences: ${process.env.NEXT_PUBLIC_APP_URL || ""}/absences`,
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (mailErr) {
      console.error("Absences creation mail error:", mailErr);
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Absences create error:", error);
    return NextResponse.json({ error: "Erreur création absence" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.ctx;
  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];

  try {
    const body = await req.json();
    const id = String(body?.id || "");
    const action = String(body?.action || "");
    const managerNote = String(body?.managerNote || "").trim();
    const justification = body?.justification || null;
    if (!id || !["VALIDER", "REFUSER", "RELANCER_JUSTIFICATIF", "DEPOSER_JUSTIFICATIF", "CLOTURER", "REOUVRIR"].includes(action)) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const rawIndex = await getIndex(orgId);
    const index = await purgeExpiredAbsences(orgId, rawIndex);

    const fileHit = await getTenantJson<AbsenceRecord>(orgId, `absences/${id}.json`);
    if (!fileHit?.data) return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
    const current = fileHit.data;

    const actor = user?.fullName || user?.firstName || "Direction";
    const isOwner = current.createdBy.userId === userId;
    const canManage = canManageAbsence(current, roles);

    if (action === "DEPOSER_JUSTIFICATIF" && !isOwner && !canManage) {
      return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
    }
    if ((action === "CLOTURER" || action === "REOUVRIR" || action === "VALIDER" || action === "REFUSER" || action === "RELANCER_JUSTIFICATIF") && !canManage) {
      return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
    }

    let updated: AbsenceRecord = {
      ...current,
      managerNote,
      updatedAt: new Date().toISOString(),
    };

    if (action === "DEPOSER_JUSTIFICATIF") {
      if (!justification?.fileName || !justification?.fileUrl) {
        return NextResponse.json({ error: "Justificatif invalide." }, { status: 400 });
      }
      updated = {
        ...updated,
        justification: {
          fileName: String(justification.fileName),
          fileUrl: String(justification.fileUrl),
          uploadedAt: new Date().toISOString(),
          uploadedBy: actor,
        },
        justificatifRelanceAt: null,
        workflowStatus: current.workflowStatus === "CLOTUREE" ? "CLOTUREE" : "JUSTIFICATIF_DEPOSE",
        history: [
          ...(current.history || []),
          {
            at: new Date().toISOString(),
            by: actor,
            action: "JUSTIFICATIF_DEPOSE",
          },
        ],
      };
    } else if (action === "VALIDER") {
      const treatmentResult = validateHoursTreatmentForAbsence(
        current.data.scope,
        current.data.etablissement,
        body?.hoursTreatment,
      );
      if (!treatmentResult.ok) {
        return NextResponse.json({ error: treatmentResult.error }, { status: 400 });
      }
      const hoursTreatment = treatmentResult.treatment;
      const closedAt = new Date().toISOString();
      updated = {
        ...updated,
        managerDecision: "VALIDEE",
        workflowStatus: "CLOTUREE",
        closedAt,
        justificatifRelanceAt: null,
        hoursTreatment,
        history: [
          ...(current.history || []),
          {
            at: closedAt,
            by: actor,
            action: "DECISION_VALIDEE",
            note: managerNote || undefined,
          },
        ],
      };

      const recipients = await resolveValidationRecipients(orgId, updated);
      if (recipients.length > 0) {
        try {
          const transporter = getMailer();
          const justificatifLine = updated.justification?.fileName
            ? `Justificatif : ${updated.justification.fileName}`
            : "Justificatif : non déposé";
          const treatmentLine = formatHoursTreatmentMailLine(updated.hoursTreatment!, updated.data.scope);
          await transporter.sendMail({
            from: `"Absences" <${process.env.SMTP_USER}>`,
            to: recipients.join(","),
            subject: `Absence validée — ${updated.createdBy.name}`,
            text: [
              `Bonjour,`,
              ``,
              `Une absence a été validée.`,
              `Personne : ${updated.createdBy.name}`,
              `Type : ${updated.data.scope === "ogec" ? "Personnel OGEC" : "Professeur"}`,
              `Établissement : ${updated.data.scope === "ogec" ? "OGEC" : updated.data.etablissement || "—"}`,
              `Période : ${formatAbsencePeriod(updated.data)}`,
              `Motif : ${updated.data.reason}`,
              updated.data.details ? `Détails : ${updated.data.details}` : "",
              justificatifLine,
              treatmentLine,
            ]
              .filter(Boolean)
              .join("\n"),
          });
        } catch (mailErr) {
          console.error("Absences validation mail error:", mailErr);
        }
      } else {
        console.warn("Absences validation mail skipped: recipients not configured.");
      }

      // Notification au créateur : absence validée
      try {
        if (updated.createdBy.email) {
          const transporter = getMailer();
          await transporter.sendMail({
            from: `"Absences" <${process.env.SMTP_USER}>`,
            to: updated.createdBy.email,
            subject: "Votre absence a été validée",
            text: [
              `Bonjour ${updated.createdBy.name},`,
              ``,
              `Votre absence a bien été validée.`,
              ``,
              `Période : ${formatAbsencePeriod(updated.data)}`,
              `Motif : ${updated.data.reason}`,
              updated.data.details ? `Détails : ${updated.data.details}` : "",
              formatHoursTreatmentCreatorMailLine(updated.hoursTreatment!, updated.data.scope),
              ``,
              `Cordialement,`,
              `L'établissement`,
            ]
              .filter(Boolean)
              .join("\n"),
          });
        }
      } catch (mailErr) {
        console.error("Absences creator validation mail error:", mailErr);
      }
    } else if (action === "REFUSER") {
      const closedAt = new Date().toISOString();
      updated = {
        ...updated,
        managerDecision: "REFUSEE",
        workflowStatus: "CLOTUREE",
        closedAt,
        justificatifRelanceAt: null,
        history: [
          ...(current.history || []),
          {
            at: closedAt,
            by: actor,
            action: "DECISION_REFUSEE",
            note: managerNote || undefined,
          },
        ],
      };
    } else if (action === "RELANCER_JUSTIFICATIF") {
      const relanceAt = new Date().toISOString();
      updated = {
        ...updated,
        justificatifRelanceAt: relanceAt,
        history: [
          ...(current.history || []),
          {
            at: relanceAt,
            by: actor,
            action: "RELANCE_JUSTIFICATIF",
            note: managerNote || undefined,
          },
        ],
      };
      try {
        if (current.createdBy.email) {
          const transporter = getMailer();
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
          await transporter.sendMail({
            from: `"Absences" <${process.env.SMTP_USER}>`,
            to: current.createdBy.email,
            subject: "Complément souhaité — justificatif d'absence",
            text: [
              `Bonjour ${current.createdBy.name},`,
              ``,
              current.justification?.fileName
                ? `La direction a examiné le justificatif déjà transmis (${current.justification.fileName}) et souhaiterait un complément ou un autre document pour finaliser votre dossier.`
                : `Votre déclaration d'absence a bien été reçue.`,
              ``,
              current.justification?.fileName
                ? `Merci de déposer le document complémentaire sur l'espace Absences. Il remplacera le fichier actuel.`
                : `La direction vous invite à déposer, si vous le souhaitez et si votre situation le nécessite, une pièce justificative pour compléter votre dossier.`,
              current.justification?.fileName
                ? ``
                : `Ce document n'est pas toujours obligatoire : cela dépend du type d'absence. En revanche, si vous en disposez, merci de le transmettre.`,
              ``,
              `Période : ${formatAbsencePeriod(current.data)}`,
              `Motif : ${current.data.reason}`,
              managerNote ? `Message de la direction : ${managerNote}` : "",
              ``,
              `Pour déposer votre justificatif :`,
              appUrl ? `${appUrl}/absences` : "Espace Absences de l'intranet",
              ``,
              `Cordialement,`,
              `La direction`,
            ]
              .filter(Boolean)
              .join("\n"),
          });
        }
      } catch (mailErr) {
        console.error("Absences relance mail error:", mailErr);
      }
    } else if (action === "CLOTURER") {
      updated = {
        ...updated,
        workflowStatus: "CLOTUREE",
        closedAt: new Date().toISOString(),
        history: [
          ...(current.history || []),
          {
            at: new Date().toISOString(),
            by: actor,
            action: "CLOTUREE",
            note: managerNote || undefined,
          },
        ],
      };
    } else {
      updated = {
        ...updated,
        workflowStatus: "OUVERTE",
        managerDecision: "EN_ATTENTE",
        closedAt: null,
        history: [
          ...(current.history || []),
          {
            at: new Date().toISOString(),
            by: actor,
            action: "REOUVERTE",
            note: managerNote || undefined,
          },
        ],
      };
    }

    await putTenantJson(orgId, `absences/${id}.json`, updated);

    const pos = index.findIndex((a) => a.id === id);
    if (pos >= 0) index[pos] = updated;
    await saveIndex(orgId, index);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Absences patch error:", error);
    return NextResponse.json({ error: "Erreur mise à jour absence" }, { status: 500 });
  }
}


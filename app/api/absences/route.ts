import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import nodemailer from "nodemailer";
import { SCHOOL } from "@/app/lib/school";

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
    startDate: string;
    endDate: string;
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
  };
}

function canViewAbsence(abs: AbsenceRecord, viewerUserId: string, roles: string[]) {
  if (abs.createdBy.userId === viewerUserId) return true;
  const flags = getRoleFlags(roles);
  if (abs.data.scope === "ogec") {
    return flags.isDirectionEcole || flags.isDirectionCollege || flags.isDirectionLycee || flags.isCompta;
  }
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

function resolveDecisionTarget(scope: AbsenceScope, etablissement: Etablissement | null) {
  if (scope === "ogec") {
    return {
      roleLabel: "Direction Lycée",
      name: SCHOOL.lycee.directrice,
      email: SCHOOL.lycee.email,
    };
  }
  if (etablissement === "École") return { roleLabel: "Direction École", name: SCHOOL.ecole.directrice, email: SCHOOL.ecole.email };
  if (etablissement === "Collège") return { roleLabel: "Direction Collège", name: SCHOOL.college.directrice, email: SCHOOL.college.email };
  return { roleLabel: "Direction Lycée", name: SCHOOL.lycee.directrice, email: SCHOOL.lycee.email };
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

async function getIndex(): Promise<AbsenceRecord[]> {
  try {
    const res = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: INDEX_KEY,
      }),
    );
    const body = await res.Body?.transformToString();
    return body ? JSON.parse(body) : [];
  } catch (e: any) {
    if (e?.name === "NoSuchKey") return [];
    throw e;
  }
}

async function saveIndex(index: AbsenceRecord[]) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: INDEX_KEY,
      Body: JSON.stringify(index),
      ContentType: "application/json",
    }),
  );
}

function parseDateOnly(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function purgeExpiredAbsences(index: AbsenceRecord[]) {
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

  for (const rec of remove) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: `absences/${rec.id}.json`,
        }),
      );
    } catch (e) {
      console.error(`Absences RGPD purge error (${rec.id}):`, e);
    }
  }

  await saveIndex(keep);
  return keep;
}

function resolveValidationRecipients(record: AbsenceRecord) {
  if (record.data.scope === "ogec") return [SCHOOL.absences.comptabilite].filter(Boolean);
  if (record.data.etablissement === "École") return [SCHOOL.absences.secretariatEcole].filter(Boolean);
  return [...SCHOOL.absences.collegeLycee].filter(Boolean);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];

  try {
    const rawIndex = await getIndex();
    const index = await purgeExpiredAbsences(rawIndex);
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
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
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
    const startDate = String(payload.startDate || "");
    const endDate = String(payload.endDate || "");
    const reason = String(payload.reason || "").trim();
    const details = String(payload.details || "").trim();
    const justificationPayload = payload?.justification || null;

    if (!startDate || !endDate || !reason) {
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
        startDate,
        endDate,
        reason,
        details,
      },
      workflowStatus: justificationPayload?.fileName && justificationPayload?.fileUrl ? "JUSTIFICATIF_DEPOSE" : "OUVERTE",
      managerDecision: "EN_ATTENTE",
      closedAt: null,
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

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `absences/${id}.json`,
        Body: JSON.stringify(record),
        ContentType: "application/json",
      }),
    );

    const rawIndex = await getIndex();
    const index = await purgeExpiredAbsences(rawIndex);
    index.push(record);
    await saveIndex(index);

    // Notification direction à la création
    try {
      const target = resolveDecisionTarget(scope, scope === "ogec" ? null : etablissement);
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
          `Période : du ${formatDateFR(startDate)} au ${formatDateFR(endDate)}`,
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
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
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

    const rawIndex = await getIndex();
    const index = await purgeExpiredAbsences(rawIndex);

    const fileRes = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `absences/${id}.json`,
      }),
    );
    const fileBody = await fileRes.Body?.transformToString();
    if (!fileBody) return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
    const current = JSON.parse(fileBody) as AbsenceRecord;

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
      updated = {
        ...updated,
        managerDecision: "VALIDEE",
        history: [
          ...(current.history || []),
          {
            at: new Date().toISOString(),
            by: actor,
            action: "DECISION_VALIDEE",
            note: managerNote || undefined,
          },
        ],
      };
      if (updated.justification?.fileName && updated.justification?.fileUrl) {
        const recipients = resolveValidationRecipients(updated);
        if (recipients.length > 0) {
          try {
            const transporter = getMailer();
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
                `Période : du ${formatDateFR(updated.data.startDate)} au ${formatDateFR(updated.data.endDate)}`,
                `Motif : ${updated.data.reason}`,
                updated.data.details ? `Détails : ${updated.data.details}` : "",
                `Justificatif : ${updated.justification.fileName}`,
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
              `Période : du ${formatDateFR(updated.data.startDate)} au ${formatDateFR(updated.data.endDate)}`,
              `Motif : ${updated.data.reason}`,
              updated.data.details ? `Détails : ${updated.data.details}` : "",
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
      updated = {
        ...updated,
        managerDecision: "REFUSEE",
        history: [
          ...(current.history || []),
          {
            at: new Date().toISOString(),
            by: actor,
            action: "DECISION_REFUSEE",
            note: managerNote || undefined,
          },
        ],
      };
    } else if (action === "RELANCER_JUSTIFICATIF") {
      updated = {
        ...updated,
        history: [
          ...(current.history || []),
          {
            at: new Date().toISOString(),
            by: actor,
            action: "RELANCE_JUSTIFICATIF",
            note: managerNote || undefined,
          },
        ],
      };
      // email relance au créateur
      try {
        if (current.createdBy.email) {
          const transporter = getMailer();
          await transporter.sendMail({
            from: `"Absences" <${process.env.SMTP_USER}>`,
            to: current.createdBy.email,
            subject: "Relance justificatif — Déclaration d'absence",
            text: [
              `Bonjour ${current.createdBy.name},`,
              ``,
              `La direction vous relance pour déposer votre justificatif d'absence.`,
              ``,
              `Période : du ${formatDateFR(current.data.startDate)} au ${formatDateFR(current.data.endDate)}`,
              `Motif : ${current.data.reason}`,
              managerNote ? `Message direction : ${managerNote}` : "",
              ``,
              `Merci de déposer votre justificatif dans l'espace Absences.`,
              `${process.env.NEXT_PUBLIC_APP_URL || ""}/absences`,
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

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `absences/${id}.json`,
        Body: JSON.stringify(updated),
        ContentType: "application/json",
      }),
    );

    const pos = index.findIndex((a) => a.id === id);
    if (pos >= 0) index[pos] = updated;
    await saveIndex(index);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Absences patch error:", error);
    return NextResponse.json({ error: "Erreur mise à jour absence" }, { status: 500 });
  }
}


import { safeCurrentUser } from "@/app/lib/intranet-session";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createTenantTransporter,
  getTenantSmtpConfig,
} from "@/app/lib/tenant-mail";
import { loadAppConfig, getEstablishmentByLabel } from "@/app/lib/app-config";
import { requireAuth } from "@/app/lib/intranet-auth";
import { getJson, putJson } from "@/app/lib/s3-storage";

const INDEX_KEY = "demandes-hse/index.json";

/** Réception des HSE acceptées ; surclassable par HSE_OPS_EMAIL. */
const DEFAULT_HSE_OPS_EMAIL = "sarah.buno@ac-normandie.fr";

export type HseEtablissement = "École" | "Collège" | "Lycée";

type HseRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  createdBy: { userId: string; name: string; email: string };
  etablissement: HseEtablissement;
  resumeDemande: string;
  motif: string;
  classe: string;
  details: string;
  decidedBy?: { userId: string; name: string };
  decidedAt?: string;
  directionNote?: string;
};

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, "");

function rolesOfUser(roleRaw: unknown): string[] {
  return Array.isArray(roleRaw) ? (roleRaw as string[]) : roleRaw ? [String(roleRaw)] : [];
}

function getRoleFlags(roles: string[]) {
  const n = roles.map(norm);
  return {
    isDirectionEcole: n.some((r) => r.includes("direction") && r.includes("ecole")),
    isDirectionCollege: n.some((r) => r.includes("direction") && r.includes("college")),
    isDirectionLycee: n.some((r) => r.includes("direction") && r.includes("lycee")),
    isProfesseur: n.some((r) => r.includes("professeur")),
  };
}

function canCreateDemand(roles: string[]) {
  return getRoleFlags(roles).isProfesseur;
}

function canManageDemand(rec: HseRecord, roles: string[]) {
  const f = getRoleFlags(roles);
  if (rec.etablissement === "École") return f.isDirectionEcole;
  if (rec.etablissement === "Collège") return f.isDirectionCollege;
  if (rec.etablissement === "Lycée") return f.isDirectionLycee;
  return false;
}

function canViewDemand(rec: HseRecord, userId: string, roles: string[]) {
  if (rec.createdBy.userId === userId) return true;
  return canManageDemand(rec, roles);
}

async function resolveDirectorMail( etab: HseEtablissement) {
  const bundle = await loadAppConfig();
  const est = getEstablishmentByLabel(bundle, etab);
  if (est) {
    return { name: est.directorName || est.label, email: est.directorEmail || "", label: est.label };
  }
  return { name: bundle.identity.name, email: "", label: etab };
}

async function getMailer() {
  const smtp = await getTenantSmtpConfig();
  if (!smtp) return null;
  const transporter = await createTenantTransporter();
  if (!transporter) return null;
  return { smtp, transporter };
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
}

async function getIndex(): Promise<HseRecord[]> {
  const hit = await getJson<HseRecord[]>( INDEX_KEY);
  return hit?.data ?? [];
}

async function saveIndex( rows: HseRecord[]) {
  await putJson(INDEX_KEY, rows);
}

function isValidEtab(v: string): v is HseEtablissement {
  return v === "École" || v === "Collège" || v === "Lycée";
}

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { userId } = gate.ctx;

  const user = await safeCurrentUser();
  const roles = rolesOfUser(user?.publicMetadata?.role);

  if (!canCreateDemand(roles)) {
    const f = getRoleFlags(roles);
    if (!f.isDirectionEcole && !f.isDirectionCollege && !f.isDirectionLycee) {
      return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
    }
  }

  try {
    const all = await getIndex();
    const filtered = all.filter((r) => canViewDemand(r, userId, roles));
    filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return NextResponse.json({ items: filtered });
  } catch (e) {
    console.error("[demandes-hse] GET", e);
    return NextResponse.json({ error: "Impossible de charger les demandes." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { userId } = gate.ctx;

  const user = await safeCurrentUser();
  const roles = rolesOfUser(user?.publicMetadata?.role);

  if (!canCreateDemand(roles)) {
    return NextResponse.json({ error: "Seuls les enseignants peuvent créer une demande HSE." }, { status: 403 });
  }

  const email = user?.primaryEmailAddress?.emailAddress?.trim() || "";
  if (!email) {
    return NextResponse.json({ error: "Votre compte doit avoir une adresse e-mail pour suivre les réponses." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const etablissement = String(body.etablissement || "").trim();
  if (!isValidEtab(etablissement)) {
    return NextResponse.json({ error: "Établissement invalide (École, Collège ou Lycée)." }, { status: 400 });
  }

  const resumeDemande = String(body.resumeDemande ?? "").trim();
  const motif = String(body.motif ?? "").trim();
  const classe = String(body.classe ?? "").trim();
  const details = String(body.details ?? "").trim();

  if (!resumeDemande || resumeDemande.length > 2000) {
    return NextResponse.json({ error: "Renseignez un intitulé ou résumé de votre demande HSE." }, { status: 400 });
  }
  if (!motif || motif.length > 8000) {
    return NextResponse.json({ error: "Le motif est requis." }, { status: 400 });
  }
  if (!classe || classe.length > 4000) {
    return NextResponse.json({ error: "Précisez la classe ou le contexte pédagogique." }, { status: 400 });
  }
  if (!details || details.length > 12000) {
    return NextResponse.json({ error: "Les précisions sur le contexte (remplacement, etc.) sont requises." }, { status: 400 });
  }

  const record: HseRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "EN_ATTENTE",
    createdBy: {
      userId,
      name: user?.fullName || user?.firstName || email,
      email,
    },
    etablissement,
    resumeDemande,
    motif,
    classe,
    details,
  };

  try {
    const all = await getIndex();
    all.push(record);
    await saveIndex( all);

    const dir = await resolveDirectorMail( etablissement);
    const mail = await getMailer();
    if (mail) {
      const { smtp, transporter } = mail;
      try {
        await transporter.sendMail({
          from: `"Demandes HSE" <${smtp.user}>`,
          to: dir.email,
          subject: `HSE — nouvelle demande (${etablissement})`,
          text: [
            `Bonjour ${dir.name},`,
            ``,
            `Une nouvelle demande d’heures supplémentaires exceptionnelles (HSE) a été déposée sur l’intranet.`,
            ``,
            `Demandeur : ${record.createdBy.name} (${record.createdBy.email})`,
            `Établissement : ${etablissement}`,
            `Demande (résumé) : ${resumeDemande}`,
            `Motif : ${motif}`,
            `Classe / contexte : ${classe}`,
            `Précisions :`,
            details,
            ``,
            `Traiter la demande : ${appUrl()}/demandes-hse`,
            ``,
            `Cordialement,`,
            `Plateforme La Providence Nicolas Barré`,
          ].join("\n"),
        });
      } catch (mailErr) {
        console.error("[demandes-hse] mail direction:", mailErr);
      }
    } else {
      console.warn("[demandes-hse] SMTP non configuré — pas d’email direction.");
    }

    return NextResponse.json({ success: true, id: record.id });
  } catch (e) {
    console.error("[demandes-hse] POST", e);
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { userId } = gate.ctx;

  const user = await safeCurrentUser();
  const roles = rolesOfUser(user?.publicMetadata?.role);

  let body: { id?: string; status?: string; directionNote?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const id = String(body?.id || "").trim();
  const statusRaw = String(body?.status || "").trim().toUpperCase();
  const directionNote = String(body?.directionNote || "").trim();

  if (!id || !["ACCEPTEE", "REFUSEE"].includes(statusRaw)) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  try {
    const all = await getIndex();
    const idx = all.findIndex((r) => r.id === id);
    if (idx < 0) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });

    const current = all[idx];
    if (!canManageDemand(current, roles)) {
      return NextResponse.json({ error: "Décision réservée à la direction concernée." }, { status: 403 });
    }
    if (current.status !== "EN_ATTENTE") {
      return NextResponse.json({ error: "Cette demande a déjà été traitée." }, { status: 400 });
    }

    const updated: HseRecord = {
      ...current,
      status: statusRaw as "ACCEPTEE" | "REFUSEE",
      updatedAt: new Date().toISOString(),
      decidedBy: { userId, name: user?.fullName || user?.firstName || "Direction" },
      decidedAt: new Date().toISOString(),
      directionNote: directionNote || undefined,
    };

    all[idx] = updated;
    await saveIndex( all);

    const creatorEmail = updated.createdBy.email;
    const base = `${appUrl()}/demandes-hse`;

    const mail = await getMailer();
    if (mail) {
      const { smtp, transporter } = mail;
      try {
        if (creatorEmail) {
          await transporter.sendMail({
            from: `"Demandes HSE" <${smtp.user}>`,
            to: creatorEmail,
            subject:
              updated.status === "ACCEPTEE"
                ? "Votre demande HSE a été acceptée"
                : "Votre demande HSE a été refusée",
            text:
              updated.status === "ACCEPTEE"
                ? [
                    `Bonjour ${updated.createdBy.name},`,
                    ``,
                    `Votre demande d’heures supplémentaires exceptionnelles a été acceptée par la direction (${updated.etablissement}).`,
                    `Résumé : ${updated.resumeDemande}`,
                    `Motif : ${updated.motif}`,
                    `Classe / contexte : ${updated.classe}`,
                    `Précisions : ${updated.details}`,
                    directionNote ? `Message de la direction : ${directionNote}` : "",
                    ``,
                    `Détail sur l’intranet : ${base}`,
                    ``,
                    `Cordialement,`,
                    `La Providence Nicolas Barré`,
                  ]
                    .filter(Boolean)
                    .join("\n")
                : [
                    `Bonjour ${updated.createdBy.name},`,
                    ``,
                    `Votre demande HSE n’a pas été acceptée.`,
                    `Établissement : ${updated.etablissement}`,
                    directionNote ? `Motif précisé par la direction : ${directionNote}` : "",
                    ``,
                    `Détail : ${base}`,
                    ``,
                    `Cordialement,`,
                    `La Providence Nicolas Barré`,
                  ]
                    .filter(Boolean)
                    .join("\n"),
          });
        }
      } catch (e) {
        console.error("[demandes-hse] mail demandeur:", e);
      }

      const nCfg = (await loadAppConfig()).notifications;
      const opsMail = process.env.HSE_OPS_EMAIL?.trim() || nCfg.hseOps || DEFAULT_HSE_OPS_EMAIL;
      if (updated.status === "ACCEPTEE" && opsMail) {
        try {
          await transporter.sendMail({
            from: `"Demandes HSE" <${smtp.user}>`,
            to: opsMail,
            subject: `[À traiter] HSE acceptée — ${updated.etablissement}`,
            text: [
              `Une demande HSE a été ACCEPTÉE par la direction.`,
              ``,
              `Demandeur : ${updated.createdBy.name} (${updated.createdBy.email})`,
              `Établissement : ${updated.etablissement}`,
              `Décision par : ${updated.decidedBy?.name}`,
              `Résumé : ${updated.resumeDemande}`,
              `Motif : ${updated.motif}`,
              `Classe / contexte : ${updated.classe}`,
              `Précisions : ${updated.details}`,
              directionNote ? `Note direction : ${directionNote}` : "",
              ``,
              `Voir sur l’intranet : ${base}`,
            ]
              .filter(Boolean)
              .join("\n"),
          });
        } catch (e) {
          console.error("[demandes-hse] mail ops:", e);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[demandes-hse] PATCH", e);
    return NextResponse.json({ error: "Mise à jour impossible." }, { status: 500 });
  }
}

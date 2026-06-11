import { NextResponse } from "next/server";
import { requireInternatAccess, requireInternatManage } from "@/app/api/internat/_auth";
import { loadAppConfig } from "@/app/lib/app-config";
import {
  buildDirectionDecisions,
  buildOutingParticipants,
  computeOutingStatus,
} from "@/app/lib/internat-outing";
import {
  notifyInternatOutingDirection,
  notifyInternatOutingParents,
} from "@/app/lib/internat-notify";
import {
  getInternatOuting,
  getInternatStudents,
  listInternatOutings,
  saveInternatOuting,
} from "@/app/lib/internat-storage";
import { newId, type InternatOuting } from "@/app/lib/internat-types";

async function notifyParentsIfReady(outing: InternatOuting): Promise<InternatOuting> {
  const status = computeOutingStatus(outing);
  if (status !== "pending_parents") return { ...outing, status };

  let updated = { ...outing, status };
  for (let i = 0; i < updated.participants.length; i++) {
    const p = updated.participants[i]!;
    if (p.parentEmailsSentAt) continue;
    const result = await notifyInternatOutingParents({ outing: updated, participantIndex: i });
    if (result.sent) {
      updated = {
        ...updated,
        participants: updated.participants.map((x, idx) =>
          idx === i ? { ...x, parentEmailsSentAt: new Date().toISOString() } : x,
        ),
      };
    }
  }
  return updated;
}

export async function GET() {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;
  const outings = await listInternatOutings();
  return NextResponse.json({ outings });
}

export async function POST(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const activity = String(body.activity || "").trim();
  const accompanists = String(body.accompanists || "").trim();
  const outingDate = String(body.outingDate || "").trim();
  const studentIds = Array.isArray(body.studentIds) ? body.studentIds.map(String) : [];

  if (!title || !activity || !accompanists || !outingDate || !/^\d{4}-\d{2}-\d{2}$/.test(outingDate)) {
    return NextResponse.json(
      { error: "Titre, activité, accompagnement, date et au moins un interne sont requis." },
      { status: 400 },
    );
  }
  if (!studentIds.length) {
    return NextResponse.json({ error: "Sélectionnez au moins un interne." }, { status: 400 });
  }

  const students = await getInternatStudents();
  const { participants, missingParents } = buildOutingParticipants(studentIds, students);
  if (!participants.length) {
    return NextResponse.json({ error: "Aucun interne valide sélectionné." }, { status: 400 });
  }
  if (missingParents.length) {
    return NextResponse.json(
      {
        error: `E-mail parent manquant pour : ${missingParents.join(", ")}. Complétez la fiche interne avant de créer la sortie.`,
      },
      { status: 400 },
    );
  }

  const bundle = await loadAppConfig();
  const now = new Date().toISOString();
  const outing: InternatOuting = {
    id: newId("out"),
    title,
    activity,
    destination: String(body.destination || "").trim() || undefined,
    accompanists,
    outingDate,
    departureTime: String(body.departureTime || "").trim() || undefined,
    returnTime: String(body.returnTime || "").trim() || undefined,
    participants,
    directionDecisions: buildDirectionDecisions(participants, bundle.establishments),
    status: "pending_direction",
    createdAt: now,
    updatedAt: now,
    createdBy: { userId: access.userId, name: access.userName },
  };

  const emailWarnings: string[] = [];
  for (let i = 0; i < outing.directionDecisions.length; i++) {
    const d = outing.directionDecisions[i]!;
    if (!d.directorEmail) {
      emailWarnings.push(`Pas d'e-mail direction pour ${d.etablissement}.`);
      continue;
    }
    const result = await notifyInternatOutingDirection({ outing, decisionIndex: i });
    if (result.sent) {
      outing.directionDecisions[i] = { ...d, emailSentAt: new Date().toISOString() };
    } else {
      emailWarnings.push(`E-mail direction ${d.etablissement} non envoyé (${result.reason}).`);
    }
  }

  outing.updatedAt = new Date().toISOString();
  await saveInternatOuting(outing);

  return NextResponse.json({
    outing,
    emailWarnings: emailWarnings.length ? emailWarnings : undefined,
  });
}

export async function PATCH(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const action = String(body.action || "");

  const outing = await getInternatOuting(id);
  if (!outing) return NextResponse.json({ error: "Sortie introuvable." }, { status: 404 });

  if (action === "cancel") {
    if (outing.status === "cancelled") {
      return NextResponse.json({ error: "Sortie déjà annulée." }, { status: 400 });
    }
    const updated: InternatOuting = {
      ...outing,
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      cancelledBy: access.userName,
      updatedAt: new Date().toISOString(),
    };
    await saveInternatOuting(updated);
    return NextResponse.json({ outing: updated });
  }

  if (action === "resend_parents") {
    let updated = await notifyParentsIfReady(outing);
    updated = { ...updated, status: computeOutingStatus(updated), updatedAt: new Date().toISOString() };
    await saveInternatOuting(updated);
    return NextResponse.json({ outing: updated });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}

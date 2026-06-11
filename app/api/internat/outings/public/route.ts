import { NextRequest, NextResponse } from "next/server";
import {
  computeOutingStatus,
  outingDateTimeLabel,
  participantsForEtab,
} from "@/app/lib/internat-outing";
import { notifyInternatOutingParents } from "@/app/lib/internat-notify";
import { findOutingByToken, saveInternatOuting } from "@/app/lib/internat-storage";
import type { InternatOuting, InternatOutingDirectionDecision, InternatOutingParticipant } from "@/app/lib/internat-types";

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    undefined
  );
}

function findDirectionDecision(outing: InternatOuting, token: string): InternatOutingDirectionDecision | null {
  return outing.directionDecisions.find((d) => d.token === token) || null;
}

function findParticipant(outing: InternatOuting, token: string): InternatOutingParticipant | null {
  return outing.participants.find((p) => p.parentToken === token) || null;
}

async function notifyAllParents(outing: InternatOuting): Promise<InternatOuting> {
  let updated = { ...outing, status: computeOutingStatus(outing) };
  if (updated.status !== "pending_parents") return updated;

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
  return { ...updated, status: computeOutingStatus(updated) };
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() || "";
  if (!token) return NextResponse.json({ error: "Token requis." }, { status: 400 });

  const outing = await findOutingByToken(token);
  if (!outing || outing.status === "cancelled") {
    return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  }

  const direction = findDirectionDecision(outing, token);
  if (direction) {
    const students = participantsForEtab(outing, direction.etablissement);
    return NextResponse.json({
      kind: "direction",
      outing: {
        title: outing.title,
        activity: outing.activity,
        destination: outing.destination,
        accompanists: outing.accompanists,
        dateLabel: outingDateTimeLabel(outing),
        etablissement: direction.etablissement,
        status: direction.status,
        students: students.map((s) => ({ name: s.studentName, classe: s.classe })),
      },
    });
  }

  const participant = findParticipant(outing, token);
  if (participant) {
    if (outing.status === "pending_direction" || outing.status === "refused") {
      return NextResponse.json({
        error:
          outing.status === "refused"
            ? "Cette sortie a été refusée par l'établissement."
            : "La validation de l'établissement est en cours. Vous serez notifié une fois la sortie validée en interne.",
      }, { status: 403 });
    }
    return NextResponse.json({
      kind: "parent",
      outing: {
        title: outing.title,
        activity: outing.activity,
        destination: outing.destination,
        accompanists: outing.accompanists,
        dateLabel: outingDateTimeLabel(outing),
        studentName: participant.studentName,
        classe: participant.classe,
        status: participant.parentStatus,
      },
    });
  }

  return NextResponse.json({ error: "Lien invalide." }, { status: 404 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "").trim();
  const decision = body.decision === "refuse" ? "refuse" : body.decision === "approve" ? "approve" : null;
  const signerName = String(body.signerName || "").trim();

  if (!token || !decision) {
    return NextResponse.json({ error: "Token et décision requis." }, { status: 400 });
  }

  const outing = await findOutingByToken(token);
  if (!outing || outing.status === "cancelled") {
    return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  }

  const ip = clientIp(req);
  const now = new Date().toISOString();

  const direction = findDirectionDecision(outing, token);
  if (direction) {
    if (direction.status !== "pending") {
      return NextResponse.json({ error: "Cette demande a déjà reçu une réponse." }, { status: 409 });
    }
    const dirIdx = outing.directionDecisions.findIndex((d) => d.token === token);
    const updatedDecisions = [...outing.directionDecisions];
    updatedDecisions[dirIdx] = {
      ...direction,
      status: decision === "approve" ? "approved" : "refused",
      decidedAt: now,
      decidedBy: signerName || `Direction ${direction.etablissement}`,
      note: body.note ? String(body.note).trim() : undefined,
    };

    let updated: InternatOuting = {
      ...outing,
      directionDecisions: updatedDecisions,
      updatedAt: now,
    };
    updated.status = computeOutingStatus(updated);

    if (updated.status === "pending_parents") {
      updated = await notifyAllParents(updated);
    }

    updated.status = computeOutingStatus(updated);
    await saveInternatOuting(updated);

    return NextResponse.json({
      ok: true,
      decision: decision === "approve" ? "approved" : "refused",
      status: updated.status,
    });
  }

  const participant = findParticipant(outing, token);
  if (participant) {
    if (outing.status === "pending_direction") {
      return NextResponse.json({ error: "La validation de l'établissement est en cours." }, { status: 403 });
    }
    if (outing.status === "refused") {
      return NextResponse.json({ error: "Cette sortie a été refusée." }, { status: 403 });
    }
    if (participant.parentStatus !== "pending") {
      return NextResponse.json({ error: "Une réponse a déjà été enregistrée pour cet élève." }, { status: 409 });
    }

    const partIdx = outing.participants.findIndex((p) => p.parentToken === token);
    const updatedParticipants = [...outing.participants];
    updatedParticipants[partIdx] = {
      ...participant,
      parentStatus: decision === "approve" ? "authorized" : "refused",
      parentRespondedAt: now,
      parentRespondedBy: signerName || "Parent",
      parentResponseIp: ip,
    };

    const updated: InternatOuting = {
      ...outing,
      participants: updatedParticipants,
      status: computeOutingStatus({ ...outing, participants: updatedParticipants }),
      updatedAt: now,
    };
    await saveInternatOuting(updated);

    return NextResponse.json({
      ok: true,
      decision: decision === "approve" ? "authorized" : "refused",
      status: updated.status,
    });
  }

  return NextResponse.json({ error: "Lien invalide." }, { status: 404 });
}

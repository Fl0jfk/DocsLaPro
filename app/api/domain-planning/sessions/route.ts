import { NextResponse } from "next/server";
import { getDomainPlanningUserDisplay, isDomainCoordinator } from "@/app/lib/domain-planning-auth";
import { loadSessions, saveSessions } from "@/app/lib/domain-planning-storage";
import type { DomainPlanningSession } from "@/app/lib/domain-planning-types";
import { requireAuth, isIntranetAdmin } from "@/app/lib/intranet-auth";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const sessions = await loadSessions();
  return NextResponse.json({ sessions });
}

export async function PUT(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const authUser = await getDomainPlanningUserDisplay();
  const isAdmin = await isIntranetAdmin();
  const isEvarsCoordinator = await isDomainCoordinator(authUser.userId, "evars");
  if (!isAdmin && !isEvarsCoordinator) {
    return NextResponse.json({ error: "Réservé aux responsables EVARS." }, { status: 403 });
  }

  const body = await req.json();
  const raw = body?.sessions;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "Liste de séances invalide." }, { status: 400 });
  }

  const sessions: DomainPlanningSession[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = String(o.id || "").trim();
    const theme = String(o.theme || "").trim();
    const intervenantLabel = String(o.intervenantLabel || "").trim();
    if (!id || !theme || !intervenantLabel) continue;
    if (!["6e", "5e", "4e", "3e"].includes(String(o.niveau))) continue;
    if (![1, 2, 3].includes(Number(o.seanceNumber))) continue;
    if (!["fixed", "svt_only", "free"].includes(String(o.intervenantConstraint))) continue;
    sessions.push({
      id,
      niveau: o.niveau as DomainPlanningSession["niveau"],
      seanceNumber: Number(o.seanceNumber) as 1 | 2 | 3,
      theme,
      intervenantLabel,
      intervenantConstraint: o.intervenantConstraint as DomainPlanningSession["intervenantConstraint"],
      mixte: Boolean(o.mixte),
    });
  }

  if (sessions.length === 0) {
    return NextResponse.json({ error: "Aucune séance valide." }, { status: 400 });
  }

  await saveSessions(sessions);
  return NextResponse.json({ ok: true, sessions });
}

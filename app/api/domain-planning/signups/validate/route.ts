import { NextResponse } from "next/server";
import { getDomainPlanningUserDisplay, isDomainCoordinator } from "@/app/lib/domain-planning-auth";
import { findSessionById, loadSignups, saveSignups } from "@/app/lib/domain-planning-storage";
import { requireAuth, isIntranetAdmin } from "@/app/lib/intranet-auth";

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const authUser = await getDomainPlanningUserDisplay();
  const isCoordinator =
    (await isIntranetAdmin()) || (await isDomainCoordinator(authUser.userId, "evars"));
  if (!isCoordinator) {
    return NextResponse.json(
      { error: "Seule la responsable EVARS peut valider les idées de séance." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const id = String(body.id || "").trim();
  if (!id) {
    return NextResponse.json({ error: "Positionnement introuvable." }, { status: 400 });
  }

  const signups = await loadSignups();
  const idx = signups.findIndex((s) => s.id === id);
  if (idx < 0) {
    return NextResponse.json({ error: "Positionnement introuvable." }, { status: 404 });
  }

  const signup = signups[idx];
  const session = await findSessionById(signup.sessionId);
  if (!session) {
    return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });
  }

  if (session.intervenantConstraint !== "free") {
    return NextResponse.json(
      { error: "Seules les séances à choix libre nécessitent une validation d'idée." },
      { status: 400 },
    );
  }

  signups[idx] = {
    ...signup,
    validationStatus: "validated",
    validatedAt: new Date().toISOString(),
    validatedByUserId: authUser.userId,
  };

  await saveSignups(signups);
  return NextResponse.json({ ok: true, signup: signups[idx] });
}

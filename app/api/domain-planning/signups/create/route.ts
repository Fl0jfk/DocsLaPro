import { NextResponse } from "next/server";
import { isSvtSubject } from "@/app/lib/domain-planning-defaults";
import { getDomainPlanningUserDisplay, isDomainCoordinator } from "@/app/lib/domain-planning-auth";
import {
  findSessionById,
  loadSignups,
  saveSignups,
} from "@/app/lib/domain-planning-storage";
import type { DomainPlanningSignup } from "@/app/lib/domain-planning-types";
import { requireAuth, isIntranetAdmin } from "@/app/lib/intranet-auth";

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const authUser = await getDomainPlanningUserDisplay();
  const body = await req.json();
  const sessionId = String(body.sessionId || "").trim();
  const className = String(body.className || "").trim();
  const subject = String(body.subject || "").trim();
  const sessionIdea = String(body.sessionIdea || "").trim();

  if (!sessionId || !className || !subject) {
    return NextResponse.json({ error: "Séance, classe et matière obligatoires." }, { status: 400 });
  }

  const session = await findSessionById(sessionId);
  if (!session) return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });

  const isCoordinator =
    (await isIntranetAdmin()) || (await isDomainCoordinator(authUser.userId, "evars"));

  if (session.intervenantConstraint === "fixed" && !isCoordinator) {
    return NextResponse.json(
      { error: "Cette séance a un intervenant imposé : inscription professeur non disponible." },
      { status: 403 },
    );
  }

  if (session.intervenantConstraint === "svt_only" && !isSvtSubject(subject) && !isCoordinator) {
    return NextResponse.json(
      { error: "Cette séance est réservée aux professeurs de SVT." },
      { status: 403 },
    );
  }

  if (session.intervenantConstraint === "free" && !sessionIdea && !isCoordinator) {
    return NextResponse.json(
      { error: "Merci de décrire brièvement votre idée de séance." },
      { status: 400 },
    );
  }

  const existing = await loadSignups();
  const slotTaken = existing.some((s) => s.sessionId === sessionId && s.className === className);
  if (slotTaken) {
    return NextResponse.json({ error: "Un professeur est déjà positionné sur cette classe." }, { status: 409 });
  }

  const signup: DomainPlanningSignup = {
    id: `signup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sessionId,
    className,
    userId: authUser.userId,
    firstName: authUser.firstName,
    lastName: authUser.lastName,
    email: authUser.email,
    subject,
    sessionIdea: sessionIdea || undefined,
    createdAt: new Date().toISOString(),
  };

  await saveSignups([...existing, signup]);
  return NextResponse.json({ ok: true, signup });
}

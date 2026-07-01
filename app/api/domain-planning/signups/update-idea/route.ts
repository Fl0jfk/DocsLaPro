import { NextResponse } from "next/server";
import { getDomainPlanningUserDisplay } from "@/app/lib/domain-planning-auth";
import { loadSignups, saveSignups } from "@/app/lib/domain-planning-storage";
import { requireAuth } from "@/app/lib/intranet-auth";

/** L'intervenant met à jour sa propre idée de séance (ex. après demande de modifications). */
export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const authUser = await getDomainPlanningUserDisplay();
  const body = await req.json();
  const id = String(body.id || "").trim();
  const sessionIdea = String(body.sessionIdea || "").trim();

  if (!id) {
    return NextResponse.json({ error: "Positionnement introuvable." }, { status: 400 });
  }
  if (!sessionIdea) {
    return NextResponse.json({ error: "L'idée de séance est obligatoire." }, { status: 400 });
  }

  const signups = await loadSignups();
  const idx = signups.findIndex((s) => s.id === id);
  if (idx < 0) {
    return NextResponse.json({ error: "Positionnement introuvable." }, { status: 404 });
  }

  const signup = signups[idx];
  if (signup.userId !== authUser.userId) {
    return NextResponse.json(
      { error: "Vous ne pouvez modifier que votre propre idée de séance." },
      { status: 403 },
    );
  }

  if (signup.validationStatus === "validated") {
    return NextResponse.json(
      { error: "Ce positionnement est déjà validé." },
      { status: 400 },
    );
  }

  signups[idx] = {
    ...signup,
    sessionIdea,
    validationStatus: "pending",
    validationComment: undefined,
    validatedAt: undefined,
    validatedByUserId: undefined,
  };

  await saveSignups(signups);
  return NextResponse.json({ ok: true, signup: signups[idx] });
}

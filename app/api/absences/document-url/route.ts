import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";

/** Pièces jointes absences : consultation désactivée (données sensibles). */
export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  return NextResponse.json(
    { error: "Les pièces jointes d'absence ne sont plus consultables." },
    { status: 403 },
  );
}

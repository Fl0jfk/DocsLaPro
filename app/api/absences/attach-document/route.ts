import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";

/** Ajout de justificatifs depuis le calendrier : désactivé. */
export async function POST() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  return NextResponse.json(
    { error: "L'ajout de justificatif depuis le calendrier est désactivé." },
    { status: 403 },
  );
}

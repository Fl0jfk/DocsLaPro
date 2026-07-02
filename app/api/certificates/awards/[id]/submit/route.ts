import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { canSubmitAward, canViewAward } from "@/app/lib/certificates-auth";
import { loadAward, loadProgram, saveAward } from "@/app/lib/certificates-storage";
import { submitAwardForSigning } from "@/app/lib/certificates-workflow";
import { safeCurrentUser } from "@/app/lib/intranet-session";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const user = await safeCurrentUser();
  const { id } = await params;
  const award = await loadAward(id);
  if (!award) return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });
  const program = await loadProgram(award.programId);
  if (!program) return NextResponse.json({ error: "Parcours introuvable." }, { status: 404 });
  if (!canSubmitAward(award, program, gate.ctx.userId)) {
    return NextResponse.json({ error: "Soumission non autorisée." }, { status: 403 });
  }
  if (!canViewAward(award, program, gate.ctx.userId, user)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const result = await submitAwardForSigning(award);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  await saveAward(result);
  return NextResponse.json({ award: result });
}

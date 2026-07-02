import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import {
  canEditProgramTitle,
  canViewProgram,
} from "@/app/lib/certificates-auth";
import { loadProgram, saveProgram, listAwardsForProgram } from "@/app/lib/certificates-storage";
import { pushProgramHistory } from "@/app/lib/certificates-workflow";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const program = await loadProgram(id);
  if (!program) return NextResponse.json({ error: "Parcours introuvable." }, { status: 404 });
  if (!canViewProgram(program, gate.ctx.userId)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const awards = await listAwardsForProgram(id);
  return NextResponse.json({ program, awards });
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const user = await safeCurrentUser();
  const { id } = await params;
  const program = await loadProgram(id);
  if (!program) return NextResponse.json({ error: "Parcours introuvable." }, { status: 404 });
  if (!canViewProgram(program, gate.ctx.userId)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  let next = { ...program };
  if (body.title !== undefined) {
    if (!canEditProgramTitle(program, gate.ctx.userId)) {
      return NextResponse.json({ error: "Seul le créateur peut modifier le titre." }, { status: 403 });
    }
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Titre requis." }, { status: 400 });
    next = pushProgramHistory({ ...next, title }, user?.fullName || "Enseignant", "TITLE_UPDATED");
  }
  await saveProgram(next);
  return NextResponse.json({ program: next });
}

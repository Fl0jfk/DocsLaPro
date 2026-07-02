import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { canManageProgramCollaborators } from "@/app/lib/certificates-auth";
import { loadProgram, saveProgram } from "@/app/lib/certificates-storage";
import { pushProgramHistory } from "@/app/lib/certificates-workflow";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const user = await safeCurrentUser();
  const { id } = await params;
  const program = await loadProgram(id);
  if (!program) return NextResponse.json({ error: "Parcours introuvable." }, { status: 404 });
  if (!canManageProgramCollaborators(program, gate.ctx.userId)) {
    return NextResponse.json({ error: "Seul le créateur peut gérer les collaborateurs." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "add");
  const collaboratorId = String(body.collaboratorId || "").trim();
  if (!collaboratorId) return NextResponse.json({ error: "collaboratorId requis." }, { status: 400 });
  if (collaboratorId === program.ownerId) {
    return NextResponse.json({ error: "Le créateur est déjà membre du parcours." }, { status: 400 });
  }
  let collaboratorIds = [...program.collaboratorIds];
  if (action === "remove") {
    collaboratorIds = collaboratorIds.filter((c) => c !== collaboratorId);
  } else if (!collaboratorIds.includes(collaboratorId)) {
    collaboratorIds.push(collaboratorId);
  }
  const next = pushProgramHistory(
    { ...program, collaboratorIds },
    user?.fullName || "Enseignant",
    action === "remove" ? "COLLABORATOR_REMOVED" : "COLLABORATOR_ADDED",
    collaboratorId,
  );
  await saveProgram(next);
  return NextResponse.json({ program: next });
}

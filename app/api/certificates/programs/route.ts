import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { canAccessCertificatesModule } from "@/app/lib/certificates-auth";
import {
  certificateUid,
  currentCertificateSchoolYear,
  type CertificateProgram,
} from "@/app/lib/certificates-types";
import { loadProgramsIndex, saveProgram } from "@/app/lib/certificates-storage";
import { pushProgramHistory } from "@/app/lib/certificates-workflow";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const user = await safeCurrentUser();
  if (!canAccessCertificatesModule(user)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const userId = gate.ctx.userId;
  const index = await loadProgramsIndex();
  const mine = index.filter((p) => p.ownerId === userId);
  const shared = index.filter((p) => p.ownerId !== userId && p.collaboratorIds.includes(userId));
  return NextResponse.json({ programs: index, mine, shared });
}

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const user = await safeCurrentUser();
  if (!canAccessCertificatesModule(user)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Titre requis." }, { status: 400 });
  const now = new Date().toISOString();
  const program: CertificateProgram = {
    id: certificateUid("prog"),
    title,
    schoolYear: String(body.schoolYear || currentCertificateSchoolYear()).trim(),
    ownerId: gate.ctx.userId,
    ownerName: user?.fullName || "Enseignant",
    collaboratorIds: [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
    history: [{ at: now, by: user?.fullName || "Enseignant", action: "CREATED" }],
  };
  await saveProgram(program);
  return NextResponse.json({ program });
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { canViewPersonnelDashboard } from "@/app/lib/personnel-types";
import { readRhPersonnelIndex } from "@/app/lib/rh/meta-storage";

function rolesFromUser(user: NonNullable<Awaited<ReturnType<typeof safeCurrentUser>>>) {
  const rolesRaw = user?.publicMetadata?.role;
  return Array.isArray(rolesRaw) ? rolesRaw.map(String) : rolesRaw ? [String(rolesRaw)] : [];
}

/** Index personnel OneDrive (léger) — fondation registre RH. */
export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const user = await safeCurrentUser();
  if (!user || !canViewPersonnelDashboard(rolesFromUser(user))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const hit = await readRhPersonnelIndex();
  if (!hit.ok) {
    const status = hit.code === "RH_DRIVE_NOT_LINKED" ? 409 : 502;
    return NextResponse.json({ error: hit.error, code: hit.code }, { status });
  }

  return NextResponse.json({
    basePath: hit.basePath,
    index: hit.index,
  });
}

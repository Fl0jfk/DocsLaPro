import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { canManagePersonnel } from "@/app/lib/personnel-types";
import { buildRhRegistre } from "@/app/lib/rh/rh-registre";

function rolesFromUser(user: NonNullable<Awaited<ReturnType<typeof safeCurrentUser>>>) {
  const rolesRaw = user?.publicMetadata?.role;
  return Array.isArray(rolesRaw) ? rolesRaw.map(String) : rolesRaw ? [String(rolesRaw)] : [];
}

/** Registre unique + alertes conformité — agrégation OneDrive meta-rh.json. */
export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const user = await safeCurrentUser();
  if (!user || !canManagePersonnel(rolesFromUser(user))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const hit = await buildRhRegistre();
  if (!hit.ok) {
    const status =
      hit.code === "RH_DRIVE_NOT_LINKED" || hit.code === "RH_DRIVE_TOKEN_MISSING" ? 409 : 502;
    return NextResponse.json({ error: hit.error, code: hit.code }, { status });
  }

  return NextResponse.json(hit.data);
}

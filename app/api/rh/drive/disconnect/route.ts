import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { canManagePersonnel } from "@/app/lib/personnel-types";
import { clearRhDriveLink } from "@/app/lib/rh/graph-rh-drive";

function rolesFromUser(user: NonNullable<Awaited<ReturnType<typeof safeCurrentUser>>>) {
  const rolesRaw = user?.publicMetadata?.role;
  return Array.isArray(rolesRaw) ? rolesRaw.map(String) : rolesRaw ? [String(rolesRaw)] : [];
}

/** Déconnecte le OneDrive RH (supprime le refresh token). */
export async function POST() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const user = await safeCurrentUser();
  if (!user || !canManagePersonnel(rolesFromUser(user))) {
    return NextResponse.json({ error: "Réservé à la RH / comptabilité." }, { status: 403 });
  }

  try {
    await clearRhDriveLink();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Déconnexion impossible." },
      { status: 500 },
    );
  }
}

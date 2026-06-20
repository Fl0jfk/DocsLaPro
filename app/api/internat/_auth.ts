import { safeCurrentUser } from "@/app/lib/intranet-session";

import { NextResponse } from "next/server";
import {
  canAccessInternatFromMetadata,
  canManageInternatConfig,
  isOrgAdminMetadata,
  rolesFromMetadata,
} from "@/app/lib/internat-rbac";
import { requireAuth } from "@/app/lib/intranet-auth";

export async function requireInternatAccess() {
  const gate = await requireAuth();
  if (!gate.ok) return { ok: false as const, response: gate.response };

  const user = await safeCurrentUser();
  const roles = rolesFromMetadata(user?.publicMetadata);
  if (!canAccessInternatFromMetadata(user?.publicMetadata)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Action non autorisée." }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    userId: gate.ctx.userId,
    user,
    roles,
    userName: user?.fullName || user?.primaryEmailAddress?.emailAddress || "Utilisateur",
  };
}

export async function requireInternatManage() {
  const access = await requireInternatAccess();
  if (!access.ok) return access;
  if (!canManageInternatConfig(access.roles) && !isOrgAdminMetadata(access.user?.publicMetadata)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Droits insuffisants pour cette action." }, { status: 403 }),
    };
  }
  return access;
}

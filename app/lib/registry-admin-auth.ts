import { NextResponse } from "next/server";
import { requireTenantAuth, type TenantAuthContext } from "@/app/lib/tenant-auth";
import { normalizeIntranetRoles } from "@/app/lib/intranet-roles";
import { findUserInRegistry, hasGlobalAdminRole, readUsersRegistry } from "@/app/lib/users-registry";
import { currentUser } from "@clerk/nextjs/server";

async function isAdminViaMetadata(): Promise<boolean> {
  const user = await currentUser();
  const roles = normalizeIntranetRoles((user?.publicMetadata as Record<string, unknown> | undefined)?.role);
  return hasGlobalAdminRole(roles);
}

/** Accès gestion utilisateurs : rôle `admin` dans le registre (ou métadonnées le temps de la migration). */
export async function requireRegistryAdmin(): Promise<
  { ok: true; ctx: TenantAuthContext } | { ok: false; response: NextResponse }
> {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate;

  const registry = await readUsersRegistry();
  const hit = findUserInRegistry(registry, { clerkUserId: gate.ctx.userId });
  if (hit && hit.orgId === gate.ctx.orgId && hasGlobalAdminRole(hit.user.roles)) {
    return gate;
  }

  if (await isAdminViaMetadata()) {
    return gate;
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "Réservé aux utilisateurs avec le rôle admin.", code: "REGISTRY_ADMIN_REQUIRED" },
      { status: 403 },
    ),
  };
}

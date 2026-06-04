import { auth, currentUser } from "@clerk/nextjs/server";
import { normalizeIntranetRoles } from "@/app/lib/intranet-roles";
import { findUserInRegistry, hasGlobalAdminRole, readUsersRegistry } from "@/app/lib/users-registry";
import { getLegacyTenantOrgId } from "@/app/lib/tenant";

/** orgId technique pour S3 (organisation Clerk ou tenant fixe en .env). */
export function getDefaultTenantOrgId(): string | null {
  return getLegacyTenantOrgId() || process.env.TENANT_ORG_ID?.trim() || null;
}

export type ResolvedTenantSession = {
  userId: string;
  orgId: string;
  orgRole: string | null;
  fromOrgMembership: boolean;
};

export function isOrgAdminFromPublicMetadata(meta: unknown): boolean {
  const m = meta as Record<string, unknown> | undefined;
  if (!m) return false;
  if (m.org_admin === true) return true;
  if (m.platform_admin === true) return true;
  return hasGlobalAdminRole(normalizeIntranetRoles(m.role));
}

/** Session tenant : membership Clerk si présente, sinon tenant fixe (.env) pour tout le personnel. */
export async function resolveTenantSession(): Promise<ResolvedTenantSession | null> {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) return null;

  const registry = await readUsersRegistry();
  const regHit = findUserInRegistry(registry, { clerkUserId: userId });
  if (regHit?.user.clerkUserId) {
    const virtualRole = hasGlobalAdminRole(regHit.user.roles) ? "org:admin" : "org:member";
    return { userId, orgId: regHit.orgId, orgRole: virtualRole, fromOrgMembership: false };
  }

  if (orgId) {
    return { userId, orgId, orgRole: orgRole ?? null, fromOrgMembership: true };
  }

  const defaultOrg = getDefaultTenantOrgId();
  if (!defaultOrg) return null;

  const user = await currentUser();
  const meta = user?.publicMetadata as Record<string, unknown> | undefined;
  const userTenant = typeof meta?.tenantOrgId === "string" ? meta.tenantOrgId.trim() : "";
  if (userTenant && userTenant !== defaultOrg) return null;

  const virtualRole = isOrgAdminFromPublicMetadata(meta) ? "org:admin" : "org:member";
  return { userId, orgId: defaultOrg, orgRole: virtualRole, fromOrgMembership: false };
}

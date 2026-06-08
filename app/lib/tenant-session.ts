import { auth, currentUser } from "@clerk/nextjs/server";
import { hasGlobalAdminRole, intranetRolesFromMetadata } from "@/app/lib/intranet-roles";

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
  return hasGlobalAdminRole(intranetRolesFromMetadata(m));
}

/** Session : utilisateur Clerk connecté (une instance = une app Clerk + un bucket). */
export async function resolveTenantSession(): Promise<ResolvedTenantSession | null> {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) return null;
  return {
    userId,
    orgId: orgId ?? "",
    orgRole: orgRole ?? null,
    fromOrgMembership: Boolean(orgId),
  };
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await currentUser();
  return isOrgAdminFromPublicMetadata(user?.publicMetadata);
}

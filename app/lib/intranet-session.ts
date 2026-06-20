import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { hasGlobalAdminRole, hasMasterRole, intranetRolesFromMetadata } from "@/app/lib/intranet-roles";

export type ResolvedSession = {
  userId: string;
};

export function isPlatformMasterFromPublicMetadata(meta: unknown): boolean {
  return hasMasterRole(intranetRolesFromMetadata(meta));
}

/** Admin établissement (paramètres tenant, relance onboarding) — pas la config plateforme. */
export function isTenantAdminFromPublicMetadata(meta: unknown): boolean {
  const m = meta as Record<string, unknown> | undefined;
  if (!m) return false;
  if (m.org_admin === true) return true;
  return hasGlobalAdminRole(intranetRolesFromMetadata(m));
}

/** Accès aux modules orgAdminOnly et APIs admin tenant. */
export function isOrgAdminFromPublicMetadata(meta: unknown): boolean {
  const m = meta as Record<string, unknown> | undefined;
  if (!m) return false;
  if (isPlatformMasterFromPublicMetadata(m)) return true;
  if (m.platform_admin === true) return true;
  return isTenantAdminFromPublicMetadata(m);
}

/** Session : utilisateur Clerk connecté (une instance = une app Clerk + un bucket). */
export async function resolveSession(): Promise<ResolvedSession | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return { userId };
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await currentUser();
  return isOrgAdminFromPublicMetadata(user?.publicMetadata);
}

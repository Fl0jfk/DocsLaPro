import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { hasGlobalAdminRole, intranetRolesFromMetadata } from "@/app/lib/intranet-roles";

export type ResolvedSession = {
  userId: string;
};

export function isOrgAdminFromPublicMetadata(meta: unknown): boolean {
  const m = meta as Record<string, unknown> | undefined;
  if (!m) return false;
  if (m.org_admin === true) return true;
  if (m.platform_admin === true) return true;
  return hasGlobalAdminRole(intranetRolesFromMetadata(m));
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

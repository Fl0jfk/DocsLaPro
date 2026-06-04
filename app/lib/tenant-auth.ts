import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireRegistryAdmin } from "@/app/lib/registry-admin-auth";
import {
  isOrgAdminFromPublicMetadata,
  resolveTenantSession,
  type ResolvedTenantSession,
} from "@/app/lib/tenant-session";
import { findUserInRegistry, hasGlobalAdminRole, readUsersRegistry } from "@/app/lib/users-registry";
import { getLegacyTenantOrgId } from "@/app/lib/tenant";

export type TenantAuthContext = {
  userId: string;
  orgId: string;
  orgRole: string | null;
};

function toCtx(session: ResolvedTenantSession): TenantAuthContext {
  return { userId: session.userId, orgId: session.orgId, orgRole: session.orgRole };
}

export async function requireTenantAuth(): Promise<
  { ok: true; ctx: TenantAuthContext } | { ok: false; response: NextResponse }
> {
  const session = await resolveTenantSession();
  if (!session) {
    const legacy = getLegacyTenantOrgId();
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: legacy
            ? "Session invalide. Reconnectez-vous."
            : "Configuration tenant manquante (LEGACY_TENANT_ORG_ID ou TENANT_ORG_ID).",
          code: "TENANT_REQUIRED",
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true, ctx: toCtx(session) };
}

/** Admin : rôle `admin` dans users-registry.json (sync Clerk) ou legacy metadata. */
export async function isTenantOrgAdmin(orgId: string): Promise<boolean> {
  const session = await resolveTenantSession();
  if (!session || session.orgId !== orgId) return false;
  const registry = await readUsersRegistry();
  const hit = findUserInRegistry(registry, { clerkUserId: session.userId });
  if (hit && hit.orgId === orgId && hasGlobalAdminRole(hit.user.roles)) return true;
  const user = await currentUser();
  return isOrgAdminFromPublicMetadata(user?.publicMetadata);
}

/** @deprecated Utiliser requireRegistryAdmin — conservé pour les imports existants. */
export async function requireTenantOrgAdmin(): Promise<
  { ok: true; ctx: TenantAuthContext } | { ok: false; response: NextResponse }
> {
  return requireRegistryAdmin();
}

/** Routes publiques : orgId via header ou body. */
export function resolvePublicTenantId(
  headerOrgId: string | null | undefined,
  bodyOrgId: string | null | undefined,
): string | null {
  const h = headerOrgId?.trim();
  if (h) return h;
  const b = bodyOrgId?.trim();
  if (b) return b;
  return getLegacyTenantOrgId();
}

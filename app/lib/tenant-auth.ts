import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isOrgAdminFromPublicMetadata, resolveTenantSession } from "@/app/lib/tenant-session";

export type TenantAuthContext = {
  userId: string;
  orgId: string;
  orgRole: string | null;
};

function toCtx(session: { userId: string; orgId: string; orgRole: string | null }): TenantAuthContext {
  return { userId: session.userId, orgId: session.orgId, orgRole: session.orgRole };
}

export async function requireTenantAuth(): Promise<
  { ok: true; ctx: TenantAuthContext } | { ok: false; response: NextResponse }
> {
  const session = await resolveTenantSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Non autorisé.", code: "AUTH_REQUIRED" }, { status: 401 }),
    };
  }
  return { ok: true, ctx: toCtx(session) };
}

export async function isTenantOrgAdmin(_orgId?: string): Promise<boolean> {
  const user = await currentUser();
  return isOrgAdminFromPublicMetadata(user?.publicMetadata);
}

export async function requireTenantOrgAdmin(): Promise<
  { ok: true; ctx: TenantAuthContext } | { ok: false; response: NextResponse }
> {
  return requireRegistryAdmin();
}

/** Admin intranet : rôle `admin` (ou legacy) dans les métadonnées Clerk. */
export async function requireRegistryAdmin(): Promise<
  { ok: true; ctx: TenantAuthContext } | { ok: false; response: NextResponse }
> {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate;

  if (await isTenantOrgAdmin()) {
    return gate;
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "Réservé aux utilisateurs avec le rôle admin.", code: "ADMIN_REQUIRED" },
      { status: 403 },
    ),
  };
}

/** @deprecated Plus de tenant public par orgId — conservé pour routes publiques legacy. */
export function resolvePublicTenantId(
  _headerOrgId: string | null | undefined,
  _bodyOrgId: string | null | undefined,
): string | null {
  return "";
}

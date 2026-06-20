import { NextResponse } from "next/server";
import {
  CLERK_ENCRYPTION_KEY_HINT,
  isClerkDynamicKeyError,
} from "@/app/lib/clerk-request-error";
import {
  isOrgAdminFromPublicMetadata,
  isPlatformMasterFromPublicMetadata,
  resolveSession,
  safeCurrentUser,
} from "@/app/lib/intranet-session";
import {
  canEditAcademicDeadlinesFromRoles,
  canViewAcademicDeadlinesFromRoles,
} from "@/app/lib/academic-deadlines-access";
import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";

export type AuthContext = {
  userId: string;
};

function clerkServerConfigResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Configuration Clerk serveur incomplète pour ce tenant.",
      code: "CLERK_SERVER_CONFIG",
      hint: CLERK_ENCRYPTION_KEY_HINT,
    },
    { status: 503 },
  );
}

export async function requireAuth(): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }
> {
  try {
    const session = await resolveSession();
    if (!session) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Non autorisé.", code: "AUTH_REQUIRED" }, { status: 401 }),
      };
    }
    return { ok: true, ctx: { userId: session.userId } };
  } catch (error) {
    if (isClerkDynamicKeyError(error)) {
      return { ok: false, response: clerkServerConfigResponse() };
    }
    throw error;
  }
}

export async function isPlatformMaster(): Promise<boolean> {
  const user = await safeCurrentUser();
  return isPlatformMasterFromPublicMetadata(user?.publicMetadata);
}

export async function isIntranetAdmin(): Promise<boolean> {
  const user = await safeCurrentUser();
  return isOrgAdminFromPublicMetadata(user?.publicMetadata);
}

export async function requireAdmin(): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }
> {
  const gate = await requireAuth();
  if (!gate.ok) return gate;

  if (await isIntranetAdmin()) {
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

export async function requirePlatformMaster(): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }
> {
  const gate = await requireAuth();
  if (!gate.ok) return gate;

  if (await isPlatformMaster()) {
    return gate;
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "Réservé au profil Master plateforme.", code: "MASTER_REQUIRED" },
      { status: 403 },
    ),
  };
}

export async function requireAcademicDeadlinesEditor(): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }
> {
  const gate = await requireAuth();
  if (!gate.ok) return gate;

  const user = await safeCurrentUser();
  const roles = intranetRolesFromMetadata(user?.publicMetadata);
  if (canEditAcademicDeadlinesFromRoles(roles)) {
    return gate;
  }

  return {
    ok: false,
    response: NextResponse.json(
      {
        error: "Réservé aux administrateurs de l'organisation.",
        code: "ACADEMIC_DEADLINES_EDITOR_REQUIRED",
      },
      { status: 403 },
    ),
  };
}

export async function requireAcademicDeadlinesViewer(): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }
> {
  const gate = await requireAuth();
  if (!gate.ok) return gate;

  const user = await safeCurrentUser();
  const roles = intranetRolesFromMetadata(user?.publicMetadata);
  if (canViewAcademicDeadlinesFromRoles(roles)) {
    return gate;
  }

  return {
    ok: false,
    response: NextResponse.json(
      {
        error: "Réservé à l'administratif et à la direction.",
        code: "ACADEMIC_DEADLINES_VIEWER_REQUIRED",
      },
      { status: 403 },
    ),
  };
}

import { NextResponse } from "next/server";
import { isOrgAdminFromPublicMetadata, resolveSession } from "@/app/lib/intranet-session";
import { currentUser } from "@clerk/nextjs/server";
import { canEditAcademicDeadlinesFromRoles } from "@/app/lib/academic-deadlines-access";
import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";

export type AuthContext = {
  userId: string;
};

export async function requireAuth(): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }
> {
  const session = await resolveSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Non autorisé.", code: "AUTH_REQUIRED" }, { status: 401 }),
    };
  }
  return { ok: true, ctx: { userId: session.userId } };
}

export async function isIntranetAdmin(): Promise<boolean> {
  const user = await currentUser();
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

export async function requireAcademicDeadlinesEditor(): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }
> {
  const gate = await requireAuth();
  if (!gate.ok) return gate;

  const user = await currentUser();
  const roles = intranetRolesFromMetadata(user?.publicMetadata);
  if (canEditAcademicDeadlinesFromRoles(roles)) {
    return gate;
  }

  return {
    ok: false,
    response: NextResponse.json(
      {
        error: "Réservé à la direction, l'administratif ou la comptabilité.",
        code: "ACADEMIC_DEADLINES_EDITOR_REQUIRED",
      },
      { status: 403 },
    ),
  };
}

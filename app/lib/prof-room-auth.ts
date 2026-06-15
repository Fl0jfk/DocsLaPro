import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { loadAppConfig } from "@/app/lib/app-config";
import { requireAuth, isIntranetAdmin, type AuthContext } from "@/app/lib/intranet-auth";

export function normalizeProfRoomAdminClerkIds(ids: unknown[]): string[] {
  return [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
}

export async function isProfRoomModuleAdmin(): Promise<boolean> {
  if (await isIntranetAdmin()) return true;
  const user = await currentUser();
  if (!user) return false;

  const config = await loadAppConfig();
  const adminIds = config.profRoom.adminClerkUserIds || [];
  return adminIds.includes(user.id);
}

export async function requireProfRoomModuleAdmin(): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }
> {
  const gate = await requireAuth();
  if (!gate.ok) return gate;
  if (!(await isProfRoomModuleAdmin())) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Réservé aux administrateurs du module réservation de salles.", code: "PROF_ROOM_ADMIN_REQUIRED" },
        { status: 403 },
      ),
    };
  }
  return gate;
}

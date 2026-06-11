import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { loadAppConfig } from "@/app/lib/app-config";
import { defaultProfRoomModule } from "@/app/lib/app-config-defaults";
import { requireAuth, isIntranetAdmin, type AuthContext } from "@/app/lib/intranet-auth";

export async function getProfRoomAdminLastNames(): Promise<string[]> {
  const config = await loadAppConfig();
  const names = config.profRoom.adminLastNames;
  return names.length > 0 ? names : defaultProfRoomModule().adminLastNames;
}

export async function isProfRoomModuleAdmin(): Promise<boolean> {
  if (await isIntranetAdmin()) return true;
  const user = await currentUser();
  if (!user) return false;

  const config = await loadAppConfig();
  const adminIds = config.profRoom.adminClerkUserIds || [];
  if (adminIds.includes(user.id)) return true;

  const lastName = (user.lastName || "").toUpperCase();
  if (!lastName) return false;
  const adminLastNames = await getProfRoomAdminLastNames();
  return adminLastNames.includes(lastName);
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

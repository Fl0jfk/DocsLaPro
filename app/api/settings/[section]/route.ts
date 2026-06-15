import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  loadAppConfig,
  saveEstablishments,
  saveNotifications,
  saveProfRoomModule,
  saveSiteIdentity,
} from "@/app/lib/app-config";
import {
  parseEstablishmentsFile,
  parseNotifications,
  parseSiteIdentity,
} from "@/app/lib/app-config-schemas";
import { requireAdmin } from "@/app/lib/intranet-auth";
import { normalizeProfRoomAdminClerkIds } from "@/app/lib/prof-room-auth";

const ALLOWED = new Set(["site", "establishments", "notifications", "prof-room"]);

export async function PUT(req: Request, ctx: { params: Promise<{ section: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { section } = await ctx.params;
  if (!ALLOWED.has(section)) {
    return NextResponse.json({ error: "Section inconnue." }, { status: 400 });
  }
  try {
    const body = await req.json();
    const user = await currentUser();
    const audit = { updatedAt: new Date().toISOString(), updatedBy: user?.fullName || user?.id || "admin" };

    if (section === "site") {
      await saveSiteIdentity( parseSiteIdentity(body));
    } else if (section === "establishments") {
      await saveEstablishments( parseEstablishmentsFile(body));
    } else if (section === "notifications") {
      await saveNotifications( parseNotifications(body));
    } else if (section === "prof-room") {
      const current = await loadAppConfig();
      const adminClerkUserIds = Array.isArray(body?.adminClerkUserIds)
        ? normalizeProfRoomAdminClerkIds(body.adminClerkUserIds)
        : current.profRoom.adminClerkUserIds || [];
      await saveProfRoomModule({ ...current.profRoom, adminClerkUserIds });
    }

    const config = await loadAppConfig();
    return NextResponse.json({ success: true, audit, config });
  } catch (e) {
    console.error("[settings] PUT", section, e);
    const msg = e instanceof Error ? e.message : "Erreur enregistrement";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

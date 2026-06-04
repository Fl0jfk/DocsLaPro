import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  loadTenantConfig,
  saveEstablishments,
  saveNotifications,
  saveTenantIdentity,
} from "@/app/lib/tenant-config";
import {
  parseEstablishmentsFile,
  parseNotifications,
  parseTenantIdentity,
} from "@/app/lib/tenant-config-schemas";
import { requireTenantOrgAdmin } from "@/app/lib/tenant-auth";

const ALLOWED = new Set(["tenant", "establishments", "notifications"]);

export async function PUT(req: Request, ctx: { params: Promise<{ section: string }> }) {
  const gate = await requireTenantOrgAdmin();
  if (!gate.ok) return gate.response;
  const { section } = await ctx.params;
  if (!ALLOWED.has(section)) {
    return NextResponse.json({ error: "Section inconnue." }, { status: 400 });
  }
  try {
    const body = await req.json();
    const user = await currentUser();
    const audit = { updatedAt: new Date().toISOString(), updatedBy: user?.fullName || user?.id || "admin" };

    if (section === "tenant") {
      await saveTenantIdentity(gate.ctx.orgId, parseTenantIdentity(body));
    } else if (section === "establishments") {
      await saveEstablishments(gate.ctx.orgId, parseEstablishmentsFile(body));
    } else if (section === "notifications") {
      await saveNotifications(gate.ctx.orgId, parseNotifications(body));
    }

    const config = await loadTenantConfig(gate.ctx.orgId);
    return NextResponse.json({ success: true, audit, config });
  } catch (e) {
    console.error("[settings] PUT", section, e);
    const msg = e instanceof Error ? e.message : "Erreur enregistrement";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

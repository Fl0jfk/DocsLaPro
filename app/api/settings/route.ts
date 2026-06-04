import { NextResponse } from "next/server";
import { loadTenantConfig } from "@/app/lib/tenant-config";
import { requireTenantOrgAdmin } from "@/app/lib/tenant-auth";

export async function GET() {
  const gate = await requireTenantOrgAdmin();
  if (!gate.ok) return gate.response;
  try {
    const config = await loadTenantConfig(gate.ctx.orgId);
    return NextResponse.json({ orgId: gate.ctx.orgId, config });
  } catch (e) {
    console.error("[settings] GET", e);
    return NextResponse.json({ error: "Impossible de charger la configuration." }, { status: 500 });
  }
}

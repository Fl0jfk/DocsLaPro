import { NextResponse } from "next/server";
import { requireTenantOrgAdmin } from "@/app/lib/tenant-auth";
import { seedTenantSettingsFromDefaults } from "@/app/lib/tenant-config";

export async function POST() {
  const gate = await requireTenantOrgAdmin();
  if (!gate.ok) return gate.response;
  try {
    await seedTenantSettingsFromDefaults(gate.ctx.orgId);
    return NextResponse.json({ success: true, orgId: gate.ctx.orgId });
  } catch (e) {
    console.error("[settings/seed]", e);
    return NextResponse.json({ error: "Échec initialisation configuration." }, { status: 500 });
  }
}

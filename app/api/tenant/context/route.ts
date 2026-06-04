import { NextResponse } from "next/server";
import { loadTenantConfig } from "@/app/lib/tenant-config";
import { requireTenantAuth } from "@/app/lib/tenant-auth";

/** Contexte tenant pour les pages admin (établissements actifs, identité courte). */
export async function GET() {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  try {
    const config = await loadTenantConfig(gate.ctx.orgId);
    return NextResponse.json({
      orgId: gate.ctx.orgId,
      identity: {
        name: config.identity.name,
        shortName: config.identity.shortName,
      },
      establishments: config.establishments,
      profRoom: config.profRoom,
    });
  } catch (e) {
    console.error("[tenant/context]", e);
    return NextResponse.json({ error: "Configuration indisponible." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { loadAppConfig } from "@/app/lib/app-config";
import { requireAuth } from "@/app/lib/intranet-auth";

/** Contexte intranet pour les pages admin (établissements actifs, identité courte). */
export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    const config = await loadAppConfig();
    return NextResponse.json({
      identity: {
        name: config.identity.name,
        shortName: config.identity.shortName,
      },
      establishments: config.establishments,
      profRoom: config.profRoom,
      domainPlanning: config.domainPlanning,
    });
  } catch (e) {
    console.error("[app/context]", e);
    return NextResponse.json({ error: "Configuration indisponible." }, { status: 500 });
  }
}

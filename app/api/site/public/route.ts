import { NextResponse } from "next/server";
import { loadAppConfig } from "@/app/lib/app-config";

/** Identité publique du site (logo header, nom) — sans authentification. */
export async function GET() {
  try {
    const config = await loadAppConfig();
    return NextResponse.json({
      name: config.identity.name,
      shortName: config.identity.shortName,
      headerLogoUrl: config.identity.headerLogoUrl || null,
    });
  } catch (e) {
    console.error("[site/public]", e);
    return NextResponse.json({ error: "Configuration indisponible." }, { status: 500 });
  }
}

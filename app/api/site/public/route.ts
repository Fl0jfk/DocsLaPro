import { NextResponse } from "next/server";
import { loadPublicSiteIdentity } from "@/app/lib/site-public";

/** Identité publique du site (logo header, nom) — sans authentification. */
export async function GET() {
  try {
    const identity = await loadPublicSiteIdentity();
    return NextResponse.json(identity);
  } catch (e) {
    console.error("[site/public]", e);
    return NextResponse.json({ error: "Configuration indisponible." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { loadAppConfig } from "@/app/lib/app-config";
import { requireAdmin } from "@/app/lib/intranet-auth";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  try {
    const config = await loadAppConfig();
    return NextResponse.json({ config });
  } catch (e) {
    console.error("[settings] GET", e);
    return NextResponse.json({ error: "Impossible de charger la configuration." }, { status: 500 });
  }
}

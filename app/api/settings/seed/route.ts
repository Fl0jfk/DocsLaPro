import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/intranet-auth";
import { seedAppSettingsFromDefaults } from "@/app/lib/app-config";

export async function POST() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  try {
    await seedAppSettingsFromDefaults();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[settings/seed]", e);
    return NextResponse.json({ error: "Échec initialisation configuration." }, { status: 500 });
  }
}

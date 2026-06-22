import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/intranet-auth";
import { loadAppConfig } from "@/app/lib/app-config";
import {
  getToolboxConfigResolved,
  parseToolboxConfig,
  resolveToolboxRentreePages,
  saveToolboxConfig,
} from "@/app/lib/toolbox-config";
import { listPortesOuvertesRegistrations, countRegistrationsBySlot } from "@/app/lib/portes-ouvertes-storage";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  try {
    const [config, app] = await Promise.all([getToolboxConfigResolved(), loadAppConfig()]);
    const registrations = await listPortesOuvertesRegistrations();
    return NextResponse.json({
      config,
      establishments: app.establishments.filter((e) => e.active !== false),
      portesOuvertesStats: countRegistrationsBySlot(registrations),
      registrationsCount: registrations.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  try {
    const body = await req.json();
    const parsed = parseToolboxConfig(body);
    const app = await loadAppConfig();
    const resolved = resolveToolboxRentreePages(parsed, app.establishments);
    await saveToolboxConfig(resolved);
    return NextResponse.json({ success: true, config: resolved });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}

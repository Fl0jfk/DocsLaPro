import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/intranet-auth";
import { getToolboxConfig, parseToolboxConfig, saveToolboxConfig } from "@/app/lib/toolbox-config";
import { listPortesOuvertesRegistrations, countRegistrationsBySlot } from "@/app/lib/portes-ouvertes-storage";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  try {
    const config = await getToolboxConfig();
    const registrations = await listPortesOuvertesRegistrations();
    return NextResponse.json({
      config,
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
    await saveToolboxConfig(parsed);
    return NextResponse.json({ success: true, config: parsed });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { loadAppConfig, saveDomainPlanningModule } from "@/app/lib/app-config";
import { parseDomainPlanningModule, type DomainPlanningModuleConfig } from "@/app/lib/app-config-schemas";
import { requireAuth } from "@/app/lib/intranet-auth";
import { requireDomainPlanningSettingsAdmin } from "@/app/lib/domain-planning-auth";
import { normalizeDomainPlanningModule } from "@/app/lib/domain-planning-defaults";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    const config = await loadAppConfig();
    return NextResponse.json({ config: normalizeDomainPlanningModule(config.domainPlanning) });
  } catch (err: unknown) {
    console.error("GET /domain-planning/module-config:", err);
    return NextResponse.json({ error: "Impossible de charger la configuration." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const gate = await requireDomainPlanningSettingsAdmin();
  if (!gate.ok) return gate.response;
  try {
    const body = await req.json();
    const current = await loadAppConfig();
    const merged = normalizeDomainPlanningModule(
      parseDomainPlanningModule({
        ...current.domainPlanning,
        ...(body && typeof body === "object" ? body : {}),
      }),
    );
    await saveDomainPlanningModule(merged);
    return NextResponse.json({ success: true, config: merged });
  } catch (err: unknown) {
    console.error("PUT /domain-planning/module-config:", err);
    const msg = err instanceof Error ? err.message : "Impossible d'enregistrer la configuration.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

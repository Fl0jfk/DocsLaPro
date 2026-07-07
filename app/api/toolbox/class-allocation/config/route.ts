import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/intranet-auth";
import {
  defaultCampaignConfig,
  loadCampaignConfig,
  saveCampaignConfig,
} from "@/app/lib/class-allocation-storage";
import { CLASS_LEVELS, type ClassAllocationCampaignConfig } from "@/app/lib/class-allocation-types";
import { loadAppConfig } from "@/app/lib/app-config";

function normalizeConfig(raw: unknown): ClassAllocationCampaignConfig {
  const d = defaultCampaignConfig();
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const levelsRaw = Array.isArray(o.levels) ? o.levels : [];
  return {
    id: String(o.id || d.id),
    label: String(o.label || d.label),
    isOpen: o.isOpen === true,
    openAt: typeof o.openAt === "string" ? o.openAt : undefined,
    closeAt: typeof o.closeAt === "string" ? o.closeAt : undefined,
    teacherCatalog: Array.isArray(o.teacherCatalog)
      ? o.teacherCatalog.map(String).map((s) => s.trim()).filter(Boolean)
      : [],
    levels: levelsRaw
      .map((l) => {
        const x = l && typeof l === "object" ? (l as Record<string, unknown>) : {};
        const level = String(x.level || "") as (typeof CLASS_LEVELS)[number];
        if (!CLASS_LEVELS.includes(level)) return null;
        return {
          level,
          sourceClassPrefixes: Array.isArray(x.sourceClassPrefixes)
            ? x.sourceClassPrefixes.map(String).map((s) => s.trim()).filter(Boolean)
            : [],
          targetClasses: Array.isArray(x.targetClasses)
            ? x.targetClasses.map(String).map((s) => s.trim()).filter(Boolean)
            : [],
        };
      })
      .filter((v): v is NonNullable<typeof v> => Boolean(v)),
  };
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const [config, app] = await Promise.all([loadCampaignConfig(), loadAppConfig()]);
  return NextResponse.json({
    config,
    establishments: app.establishments,
  });
}

export async function PUT(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const body = await req.json();
  const config = normalizeConfig(body);
  await saveCampaignConfig(config);
  return NextResponse.json({ ok: true, config });
}

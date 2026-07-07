import { NextResponse } from "next/server";
import { loadAppConfig } from "@/app/lib/app-config";
import { dashboardQuickLinksFromExternalLinks } from "@/app/lib/dashboard-external-links";
import { requireAuth } from "@/app/lib/intranet-auth";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    const config = await loadAppConfig();
    return NextResponse.json({
      links: dashboardQuickLinksFromExternalLinks(config.externalLinks),
    });
  } catch (e) {
    console.error("[dashboard/links]", e);
    return NextResponse.json({ links: [] });
  }
}

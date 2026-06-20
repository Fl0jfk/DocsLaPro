import { safeCurrentUser } from "@/app/lib/intranet-session";
import { NextResponse } from "next/server";

import { loadAppConfig } from "@/app/lib/app-config";
import { requireAuth } from "@/app/lib/intranet-auth";
import { isOrgAdminFromPublicMetadata, isPlatformMasterFromPublicMetadata } from "@/app/lib/intranet-session";
import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";

/** Contexte intranet pour les pages admin (établissements actifs, identité courte). */
export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    const [config, user] = await Promise.all([loadAppConfig(), safeCurrentUser()]);
    const intranetRoles = intranetRolesFromMetadata(user?.publicMetadata);
    return NextResponse.json({
      identity: {
        name: config.identity.name,
        shortName: config.identity.shortName,
        dashboardAccent: config.identity.dashboardAccent,
      },
      establishments: config.establishments,
      profRoom: config.profRoom,
      domainPlanning: config.domainPlanning,
      travelsOptions: config.travels,
      integrations: config.integrations,
      onboardingCompleted: config.identity.onboardingCompleted === true,
      session: {
        intranetRoles,
        isGlobalAdmin: isOrgAdminFromPublicMetadata(user?.publicMetadata),
        isPlatformMaster: isPlatformMasterFromPublicMetadata(user?.publicMetadata),
      },
    });
  } catch (e) {
    console.error("[app/context]", e);
    return NextResponse.json({ error: "Configuration indisponible." }, { status: 500 });
  }
}

import { safeCurrentUser } from "@/app/lib/intranet-session";
import { NextResponse } from "next/server";

import { loadAppConfig } from "@/app/lib/app-config";
import { requireAuth } from "@/app/lib/intranet-auth";
import { isOrgAdminFromPublicMetadata, isPlatformMasterFromPublicMetadata } from "@/app/lib/intranet-session";
import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";
import { getTenant } from "@/app/lib/tenant-context";
import { isPlatformTenantSlug } from "@/app/lib/platform-tenant";
import { getTenantBilling } from "@/app/lib/tenant-billing";
import { BILLING_GRACE_DAYS } from "@/app/lib/tenant-billing-types";

/** Contexte intranet pour les pages admin (établissements actifs, identité courte). */
export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    const [config, user, tenant] = await Promise.all([
      loadAppConfig(),
      safeCurrentUser(),
      getTenant().catch(() => null),
    ]);
    const intranetRoles = intranetRolesFromMetadata(user?.publicMetadata);
    const billing =
      tenant && !isPlatformTenantSlug(tenant.slug)
        ? (() => {
            const b = getTenantBilling(tenant);
            return {
              status: b.status,
              graceEndsAt: b.graceEndsAt,
              lastFailureAt: b.lastFailureAt,
              graceDays: BILLING_GRACE_DAYS,
              suspendedReason: b.suspendedReason,
            };
          })()
        : null;
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
      billing,
    });
  } catch (e) {
    console.error("[app/context]", e);
    return NextResponse.json({ error: "Configuration indisponible." }, { status: 500 });
  }
}

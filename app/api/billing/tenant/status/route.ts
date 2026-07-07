import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/intranet-auth";
import { getTenant } from "@/app/lib/tenant-context";
import { isPlatformTenantSlug } from "@/app/lib/platform-tenant";
import { getTenantBilling } from "@/app/lib/tenant-billing";
import { BILLING_GRACE_DAYS } from "@/app/lib/tenant-billing-types";

/** Statut facturation du tenant courant (bannière dashboard). */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  try {
    const tenant = await getTenant();
    if (isPlatformTenantSlug(tenant.slug)) {
      return NextResponse.json({ billing: null });
    }
    const billing = getTenantBilling(tenant);
    return NextResponse.json({
      billing: {
        status: billing.status,
        graceEndsAt: billing.graceEndsAt,
        lastFailureAt: billing.lastFailureAt,
        failureCount: billing.failureCount || 0,
        graceDays: BILLING_GRACE_DAYS,
        suspendedReason: billing.suspendedReason,
        microsoftLicensesStatus: billing.microsoftLicenses?.status,
      },
    });
  } catch (e) {
    console.error("[billing/tenant/status]", e);
    return NextResponse.json({ error: "Statut indisponible." }, { status: 500 });
  }
}

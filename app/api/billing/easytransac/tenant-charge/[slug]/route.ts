import { NextResponse } from "next/server";
import {
  EASYTRANSAC_BILLING,
  initEasytransacSddPayment,
} from "@/app/lib/billing/easytransac";
import { computePricingWithA3Extras } from "@/app/lib/pricing";
import { platformAppOrigin } from "@/app/lib/platform-portal-url";
import { requirePlatformMaster } from "@/app/lib/intranet-auth";
import { loadAllTenants } from "@/app/lib/tenant-registry";
import { getTenantBilling, tenantRecurringOrderId } from "@/app/lib/tenant-billing";

type RouteCtx = { params: Promise<{ slug: string }> };

/** Déclenche un prélèvement SDD mensuel pour un tenant (Master). */
export async function POST(_req: Request, ctx: RouteCtx) {
  const gate = await requirePlatformMaster();
  if (!gate.ok) return gate.response;

  if (!EASYTRANSAC_BILLING.isConfigured) {
    return NextResponse.json({ error: "Easytransac non configuré." }, { status: 503 });
  }

  const { slug } = await ctx.params;
  const tenant = await loadAllTenants().then((list) =>
    list.find((t) => t.slug.toLowerCase() === slug.toLowerCase()),
  );
  if (!tenant) return NextResponse.json({ error: "Tenant introuvable." }, { status: 404 });

  const billing = getTenantBilling(tenant);
  if (!billing.adminEmail) {
    return NextResponse.json({ error: "E-mail admin facturation manquant." }, { status: 400 });
  }
  const students = billing.estimatedStudentCount || 100;
  const mode = billing.billingMode || "monthly";
  const extraA3Count = billing.extraA3Count || 0;
  const pricing = computePricingWithA3Extras(students, mode, extraA3Count);
  const amountEur =
    mode === "monthly" ? pricing.totalMonthlyWithExtras : pricing.totalAnnualWithExtras;
  const amountCents = Math.max(100, Math.round(amountEur * 100));
  const orderId = tenantRecurringOrderId(tenant.slug);
  const base = platformAppOrigin();

  try {
    const payment = await initEasytransacSddPayment({
      amountCents,
      email: billing.adminEmail,
      firstName: "Admin",
      lastName: tenant.label.slice(0, 32) || tenant.slug,
      orderId,
      description: `Abonnement Scola — ${tenant.label}${extraA3Count > 0 ? ` (+${extraA3Count} A3)` : ""}`,
      returnUrl: `${base}/plateforme/tenants/${tenant.slug}/billing`,
      clientId: billing.easytransacCustomerId,
    });

    return NextResponse.json({
      ok: true,
      tid: payment.tid,
      redirectUrl: payment.redirectUrl,
      orderId,
      amountEur,
      extraA3Count,
    });
  } catch (e) {
    console.error("[easytransac/tenant-charge]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Prélèvement impossible." },
      { status: 502 },
    );
  }
}

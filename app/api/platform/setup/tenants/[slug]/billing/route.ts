import { NextResponse } from "next/server";
import { requirePlatformMaster } from "@/app/lib/intranet-auth";
import { getTenantEditPayload } from "@/app/lib/tenant-registry-admin";
import {
  getTenantBilling,
  reactivateTenant,
  requestMicrosoftLicensesSuspend,
  revokeMicrosoftLicenses,
  suspendTenant,
  updateTenantExtraA3Count,
} from "@/app/lib/tenant-billing";

type RouteCtx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const gate = await requirePlatformMaster();
  if (!gate.ok) return gate.response;

  const { slug } = await ctx.params;
  const payload = await getTenantEditPayload(slug);
  if (!payload) return NextResponse.json({ error: "Tenant introuvable." }, { status: 404 });

  return NextResponse.json({
    slug,
    label: payload.entry.label,
    billing: getTenantBilling(payload.entry),
  });
}

export async function POST(req: Request, ctx: RouteCtx) {
  const gate = await requirePlatformMaster();
  if (!gate.ok) return gate.response;

  const { slug } = await ctx.params;
  let body: { action?: string; reason?: string; extraA3Count?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const action = body.action?.trim();
  const by = gate.ctx.userId;

  try {
    let tenant;
    switch (action) {
      case "suspend":
        tenant = await suspendTenant(slug, by, body.reason);
        break;
      case "reactivate":
        tenant = await reactivateTenant(slug, by);
        break;
      case "microsoft_suspend":
        tenant = await requestMicrosoftLicensesSuspend(slug, by, body.reason);
        break;
      case "microsoft_revoke":
        tenant = await revokeMicrosoftLicenses(slug, by);
        break;
      case "set_extra_a3":
        tenant = await updateTenantExtraA3Count(slug, Number(body.extraA3Count || 0), by);
        break;
      default:
        return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      billing: getTenantBilling(tenant),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Action impossible";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

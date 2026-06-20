import { NextResponse } from "next/server";
import { requirePlatformMaster } from "@/app/lib/intranet-auth";
import {
  getTenantEditPayload,
  tenantToEditPayload,
  updateTenant,
  upsertInputFromBody,
} from "@/app/lib/tenant-registry-admin";
import { isRegistryWritable } from "@/app/lib/tenant-registry";

type RouteCtx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const gate = await requirePlatformMaster();
  if (!gate.ok) return gate.response;

  const { slug } = await ctx.params;
  try {
    const payload = await getTenantEditPayload(slug);
    if (!payload) {
      return NextResponse.json({ error: "Tenant introuvable." }, { status: 404 });
    }
    return NextResponse.json({ tenant: payload, writable: isRegistryWritable() });
  } catch (e) {
    console.error("[platform/setup/tenants GET]", e);
    return NextResponse.json({ error: "Chargement impossible." }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: RouteCtx) {
  const gate = await requirePlatformMaster();
  if (!gate.ok) return gate.response;

  if (!isRegistryWritable()) {
    return NextResponse.json(
      {
        error:
          "Écriture impossible : configurez REGISTRY_BUCKET (S3) sur l'environnement plateforme.",
      },
      { status: 400 },
    );
  }

  const { slug } = await ctx.params;
  try {
    const body = await req.json();
    const input = upsertInputFromBody(body);
    const tenant = await updateTenant(slug, input);
    return NextResponse.json({
      success: true,
      tenant: tenantToEditPayload(tenant),
      message: `Tenant « ${tenant.slug} » enregistré.`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Enregistrement impossible";
    console.error("[platform/setup/tenants PUT]", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

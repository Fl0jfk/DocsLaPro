import { NextResponse } from "next/server";
import { requirePlatformMaster } from "@/app/lib/intranet-auth";
import {
  createTenant,
  tenantToEditPayload,
  upsertInputFromBody,
} from "@/app/lib/tenant-registry-admin";
import { isRegistryWritable } from "@/app/lib/tenant-registry";

export async function POST(req: Request) {
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

  try {
    const body = await req.json();
    const input = upsertInputFromBody(body);
    const tenant = await createTenant(input);
    return NextResponse.json({
      success: true,
      tenant: tenantToEditPayload(tenant),
      message: `Tenant « ${tenant.slug} » créé.`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Création impossible";
    console.error("[platform/setup/tenants POST]", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

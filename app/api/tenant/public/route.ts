import { NextResponse } from "next/server";
import { getTenant } from "@/app/lib/tenant-context";

/** Infos publiques du tenant (sans secrets) — utile pour debug / MSAL futur. */
export async function GET() {
  try {
    const tenant = await getTenant();
    return NextResponse.json({
      slug: tenant.slug,
      kind: tenant.kind,
      label: tenant.label,
      appUrl: tenant.appUrl,
      clerkPublishableKey: tenant.clerkPublishableKey,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tenant introuvable";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

import { NextResponse } from "next/server";
import { getTenant } from "@/app/lib/tenant-context";
import { getTenantSecrets } from "@/app/lib/tenant-registry";
import { loadAppConfig } from "@/app/lib/app-config";

/** Infos publiques du tenant (sans secrets serveur). */
export async function GET() {
  try {
    const tenant = await getTenant();
    const secrets = await getTenantSecrets(tenant.slug);
    const config = await loadAppConfig();

    const msFromEnv = {
      clientId: process.env.NEXT_PUBLIC_CLIENT_ID?.trim() || "",
      tenantId: process.env.NEXT_PUBLIC_TENANT_ID?.trim() || "",
    };
    const msFromSecrets = secrets?.microsoft;

    return NextResponse.json({
      slug: tenant.slug,
      kind: tenant.kind,
      label: tenant.label,
      appUrl: tenant.appUrl,
      clerkPublishableKey: tenant.clerkPublishableKey,
      microsoftOneDrive: {
        enabled: config.integrations.microsoftOneDrive?.enabled === true,
        clientId: msFromSecrets?.clientId || msFromEnv.clientId || null,
        tenantId: msFromSecrets?.tenantId || msFromEnv.tenantId || null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tenant introuvable";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

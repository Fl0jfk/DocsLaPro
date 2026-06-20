import { isPlatformHostname } from "@/app/lib/platform-hostname";
import { platformAppOrigin } from "@/app/lib/platform-portal-url";
import { normalizeHostname } from "@/app/lib/tenant-registry";
import type { TenantConfig } from "@/app/lib/tenant-types";

export function tenantOrigin(tenant: TenantConfig, host: string): string {
  const appUrl = tenant.appUrl?.trim();
  if (appUrl) {
    try {
      return new URL(appUrl.startsWith("http") ? appUrl : `https://${appUrl}`).origin;
    } catch {
      /* fall through */
    }
  }

  const normalized = normalizeHostname(host);
  if (normalized) return `https://${normalized}`;
  return platformAppOrigin();
}

/** URL absolue après connexion — évite une redirection vers docslapro.com depuis lp. */
export function clerkAfterSignInUrl(tenant: TenantConfig, host: string): string {
  if (isPlatformHostname(normalizeHostname(host))) {
    return `${platformAppOrigin()}/plateforme`;
  }
  return `${tenantOrigin(tenant, host)}/dashboard`;
}

export function clerkSignInPageUrl(tenant: TenantConfig, host: string): string {
  if (isPlatformHostname(normalizeHostname(host))) {
    return `${platformAppOrigin()}/sign-in`;
  }
  return `${tenantOrigin(tenant, host)}/sign-in`;
}

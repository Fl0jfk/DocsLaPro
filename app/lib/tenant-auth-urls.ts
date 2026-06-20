import { isLocalDevHostname } from "@/app/lib/clerk-tenant-keys";
import { isPlatformHostname } from "@/app/lib/platform-hostname";
import { isPlatformTenantSlug } from "@/app/lib/platform-tenant";
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

/** Origine canonique du tenant (sous-domaine établissement ou vitrine plateforme). */
export function tenantCanonicalOrigin(tenant: TenantConfig): string {
  if (isPlatformTenantSlug(tenant.slug)) {
    return platformAppOrigin();
  }
  return tenantOrigin(tenant, tenant.hostnames.find((h) => !isLocalDevHostname(h)) ?? "");
}

export function tenantCanonicalHostname(tenant: TenantConfig): string | null {
  try {
    return normalizeHostname(new URL(tenantCanonicalOrigin(tenant)).hostname);
  } catch {
    return null;
  }
}

/** URL absolue après connexion — toujours sur le domaine canonique du tenant. */
export function clerkAfterSignInUrl(tenant: TenantConfig, host: string): string {
  if (isPlatformTenantSlug(tenant.slug) || isPlatformHostname(normalizeHostname(host))) {
    return `${platformAppOrigin()}/plateforme`;
  }
  return `${tenantCanonicalOrigin(tenant)}/dashboard`;
}

export function clerkSignInPageUrl(tenant: TenantConfig, host: string): string {
  if (isPlatformTenantSlug(tenant.slug) || isPlatformHostname(normalizeHostname(host))) {
    return `${platformAppOrigin()}/sign-in`;
  }
  return `${tenantCanonicalOrigin(tenant)}/sign-in`;
}

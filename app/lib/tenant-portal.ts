import { isLocalDevHostname } from "@/app/lib/clerk-tenant-keys";
import { isPlatformTenantSlug } from "@/app/lib/platform-tenant";
import { loadAllTenants } from "@/app/lib/tenant-registry";
import type { TenantConfig, TenantPostalAddress } from "@/app/lib/tenant-types";

export type PublicTenantCatalogEntry = {
  slug: string;
  kind: string;
  kindLabel: string;
  label: string;
  appUrl: string;
  primaryHostname: string | null;
  postalAddress: TenantPostalAddress | null;
  postalAddressLabel: string;
  logoUrl: string | null;
  signInUrl: string;
};

function kindLabel(kind: string): string {
  return kind === "standalone" ? "École" : "Groupe scolaire";
}

export function formatPostalAddress(addr?: TenantPostalAddress | null): string {
  if (!addr) return "";
  const line2 = [addr.zip, addr.city].filter(Boolean).join(" ");
  return [addr.street, line2].filter(Boolean).join(", ");
}

function primaryHostname(tenant: TenantConfig): string | null {
  const host = tenant.hostnames.find((h) => !isLocalDevHostname(h));
  return host ?? tenant.hostnames[0] ?? null;
}

/** URL de connexion Clerk pour un tenant (origine du sous-domaine + /sign-in). */
export function tenantSignInUrl(tenant: TenantConfig, portalHost: string): string {
  if (isLocalDevHostname(portalHost)) {
    return "/sign-in";
  }

  const appUrl = tenant.appUrl?.trim().replace(/\/$/, "");
  if (appUrl) {
    try {
      const origin = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
      return `${new URL(origin).origin}/sign-in`;
    } catch {
      /* fall through */
    }
  }

  const host = primaryHostname(tenant);
  if (host && !isLocalDevHostname(host)) {
    return `https://${host}/sign-in`;
  }

  return "/sign-in";
}

export function tenantToCatalogEntry(
  tenant: TenantConfig,
  portalHost: string,
): PublicTenantCatalogEntry {
  const addressLabel = formatPostalAddress(tenant.postalAddress);
  return {
    slug: tenant.slug,
    kind: tenant.kind,
    kindLabel: kindLabel(tenant.kind),
    label: tenant.label,
    appUrl: tenant.appUrl,
    primaryHostname: primaryHostname(tenant),
    postalAddress: tenant.postalAddress ?? null,
    postalAddressLabel: addressLabel,
    logoUrl: tenant.logoUrl?.trim() || null,
    signInUrl: tenantSignInUrl(tenant, portalHost),
  };
}

/** Libellé pour <select> : nom — type — adresse postale */
export function tenantSelectLabel(entry: PublicTenantCatalogEntry): string {
  const address = entry.postalAddressLabel || "Adresse non renseignée";
  return `${entry.label} — ${entry.kindLabel} — ${address}`;
}

/** Établissements visibles sur le portail scola.fr (hors tenant plateforme). */
export async function loadPublicTenantCatalog(portalHost: string): Promise<PublicTenantCatalogEntry[]> {
  const tenants = await loadAllTenants();
  return tenants
    .filter((t) => !isPlatformTenantSlug(t.slug))
    .map((t) => tenantToCatalogEntry(t, portalHost))
    .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
}

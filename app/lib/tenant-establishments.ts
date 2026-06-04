import type { ClerkLikeUser } from "@/app/lib/travels-direction-permissions";
import type { Establishment } from "@/app/lib/tenant-config-schemas";
import { loadTenantConfig, getEstablishmentByLabel } from "@/app/lib/tenant-config";

const norm = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[_\s-]+/g, "");

export function userRoleSlugs(user: ClerkLikeUser | null): string[] {
  if (!user?.publicMetadata) return [];
  const raw = user.publicMetadata.role;
  return Array.isArray(raw) ? (raw as string[]) : raw ? [String(raw)] : [];
}

export function canSignForEstablishmentLabel(
  user: ClerkLikeUser | null,
  establishments: Establishment[],
  etablissementLabel: string | null | undefined,
): boolean {
  if (!user || !etablissementLabel) return false;
  const est = establishments.find((e) => e.label === etablissementLabel && e.active !== false);
  if (!est) return false;
  const roles = userRoleSlugs(user).map(norm);
  const slugs = (est.clerkRoleSlugs || []).map(norm);
  return slugs.some((s) => roles.some((r) => r === s || r.includes(s) || s.includes(r)));
}

export async function canSignTravelsDirectionForEtabTenant(
  user: ClerkLikeUser | null,
  orgId: string,
  etablissement: string | null | undefined,
): Promise<boolean> {
  const bundle = await loadTenantConfig(orgId);
  return canSignForEstablishmentLabel(user, bundle.establishments, etablissement);
}

export async function resolveDirectorFromTenant(
  orgId: string,
  etablissementLabel: string | null | undefined,
): Promise<{ label: string; directrice: string; email: string }> {
  const bundle = await loadTenantConfig(orgId);
  const est = getEstablishmentByLabel(bundle, etablissementLabel || "");
  if (est) {
    return {
      label: est.label,
      directrice: est.directorName || est.label,
      email: est.directorEmail || "",
    };
  }
  return {
    label: bundle.identity.shortName || bundle.identity.name,
    directrice: bundle.identity.name,
    email: "",
  };
}

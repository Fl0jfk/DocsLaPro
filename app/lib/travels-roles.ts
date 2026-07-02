import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";
import { hasGlobalAdminRole, hasRole } from "@/app/lib/intranet-role-utils";

const norm = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[_\s-]+/g, "");

export function intranetRolesFromUserLike(user: {
  publicMetadata?: Record<string, unknown> | null;
} | null | undefined): string[] {
  return intranetRolesFromMetadata(user?.publicMetadata);
}

export function userHasAdministratifRoleFromMetadata(
  publicMetadata?: Record<string, unknown> | null,
): boolean {
  return hasRole(intranetRolesFromMetadata(publicMetadata), "administratif");
}

/** Réattribuer le créateur d'un dossier voyage (administratif ou admin org). */
export function canReassignTravelsOwner(
  user: { publicMetadata?: Record<string, unknown> | null } | null | undefined,
): boolean {
  const roles = intranetRolesFromMetadata(user?.publicMetadata);
  return hasRole(roles, "administratif") || hasGlobalAdminRole(roles);
}

export function userHasComptaRoleFromMetadata(
  publicMetadata?: Record<string, unknown> | null,
): boolean {
  const roles = intranetRolesFromUserLike({ publicMetadata });
  return roles.includes("comptabilité") || roles.some((r) => norm(r).includes("comptabilite"));
}

export function userHasAdministratifRole(user: {
  publicMetadata?: Record<string, unknown> | null;
} | null | undefined): boolean {
  return userHasAdministratifRoleFromMetadata(user?.publicMetadata);
}

import { hasRole } from "@/app/lib/intranet-role-utils";
import { INTRANET_DIRECTION_SLUGS } from "@/app/lib/intranet-roles";

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, "");

export function isDirectionRole(roles: string[]): boolean {
  return INTRANET_DIRECTION_SLUGS.some((slug) => hasRole(roles, slug));
}

export function canAccessRgpdModule(roles: string[]): boolean {
  if (isDirectionRole(roles)) return true;
  if (hasRole(roles, "administratif")) return true;
  if (roles.some((r) => norm(r) === "admin")) return true;
  return false;
}

export function canManageRgpdWorkspace(roles: string[]): boolean {
  return canAccessRgpdModule(roles);
}

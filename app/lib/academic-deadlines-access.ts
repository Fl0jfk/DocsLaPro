import { INTRANET_DIRECTION_SLUGS } from "@/app/lib/intranet-roles";
import { hasGlobalAdminRole, hasRole } from "@/app/lib/intranet-role-utils";

/** Widget échéances académiques : administratif et directions (lecture seule). */
export function canViewAcademicDeadlinesFromRoles(roles: string[]): boolean {
  if (hasGlobalAdminRole(roles)) return true;
  if (hasRole(roles, "administratif")) return true;
  return INTRANET_DIRECTION_SLUGS.some((slug) => hasRole(roles, slug));
}

/** Modification du calendrier : admins org uniquement (widget visuel pour le reste). */
export function canEditAcademicDeadlinesFromRoles(roles: string[]): boolean {
  return hasGlobalAdminRole(roles);
}

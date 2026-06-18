import { hasGlobalAdminRole, hasRole } from "@/app/lib/intranet-role-utils";

/** Directions, administratif, compta et admins org peuvent alimenter le calendrier académique. */
export function canEditAcademicDeadlinesFromRoles(roles: string[]): boolean {
  if (hasGlobalAdminRole(roles)) return true;
  return (
    hasRole(roles, "direction_ecole") ||
    hasRole(roles, "direction_college") ||
    hasRole(roles, "direction_lycee") ||
    hasRole(roles, "administratif") ||
    hasRole(roles, "comptabilite")
  );
}

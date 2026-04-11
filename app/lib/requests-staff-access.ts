import { isListedAsRequestsStaff } from "@/app/lib/staff-directory";

export const CLERK_STAFF_ROLES_FOR_REQUESTS = ["administratif","direction_ecole","direction_college","direction_lycee", "maintenance","comptabilite","education","infirmerie",] as const;

function normalizeRole(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s-]+/g, "_");
}

export function hasClerkStaffRoleForRequests(roles: string[]): boolean {
  const normalized = roles.map(normalizeRole);
  return CLERK_STAFF_ROLES_FOR_REQUESTS.some((role) => normalized.includes(role));
}

export function canAccessRequestsStaffBoard(roles: string[], userEmail: string): boolean {
  return hasClerkStaffRoleForRequests(roles) || isListedAsRequestsStaff(userEmail);
}

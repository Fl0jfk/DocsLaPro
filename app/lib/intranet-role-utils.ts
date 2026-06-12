/** Utilitaires rôles légers (middleware + catalogue modules, sans dépendance absences). */

export function normRole(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, "");
}

export function hasRole(roles: string[], matcher: string): boolean {
  const m = normRole(matcher);
  return roles.some((r) => normRole(r).includes(m));
}

export function hasGlobalAdminRole(roles: string[]): boolean {
  return roles.includes("admin");
}

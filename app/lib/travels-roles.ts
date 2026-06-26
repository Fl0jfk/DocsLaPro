const norm = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[_\s-]+/g, "");

export function intranetRolesFromUserLike(user: {
  publicMetadata?: Record<string, unknown> | null;
} | null | undefined): string[] {
  const raw = user?.publicMetadata?.role;
  return Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
}

export function userHasAdministratifRoleFromMetadata(
  publicMetadata?: Record<string, unknown> | null,
): boolean {
  return intranetRolesFromUserLike({ publicMetadata }).some((r) => norm(r).includes("administratif"));
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

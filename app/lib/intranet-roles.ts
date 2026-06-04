/** Slugs stockés dans Clerk `publicMetadata.role` (tableau de strings). */
export const INTRANET_ROLE_OPTIONS: { slug: string; label: string }[] = [
  { slug: "admin", label: "Admin (gestion utilisateurs & paramètres)" },
  { slug: "administratif", label: "Administratif" },
  { slug: "professeur", label: "Professeur" },
  { slug: "direction_ecole", label: "Direction école" },
  { slug: "direction_college", label: "Direction collège" },
  { slug: "direction_lycee", label: "Direction lycée" },
  { slug: "comptabilite", label: "Comptabilité" },
  { slug: "maintenance", label: "Maintenance" },
  { slug: "infirmerie", label: "Infirmerie" },
  { slug: "education", label: "Éducation / vie scolaire" },
];

const ALLOWED = new Set(INTRANET_ROLE_OPTIONS.map((r) => r.slug));

export function normalizeIntranetRoles(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : typeof input === "string" && input ? [input] : [];
  const out: string[] = [];
  for (const r of raw) {
    const s = String(r).trim();
    if (s && ALLOWED.has(s) && !out.includes(s)) out.push(s);
  }
  return out;
}

export function intranetRolesFromMetadata(meta: unknown): string[] {
  const role = (meta as Record<string, unknown> | undefined)?.role;
  return normalizeIntranetRoles(role);
}

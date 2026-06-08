/**
 * Stockage S3 : chemins à la racine du bucket (une instance = un bucket dédié).
 */

export function s3Key(relativePath: string): string {
  const rel = relativePath.replace(/^\/+/, "");
  if (rel.startsWith("tenants/")) {
    const parts = rel.split("/");
    if (parts.length >= 3) return parts.slice(2).join("/");
  }
  return rel;
}

/** @deprecated orgId ignoré — conservé pour compatibilité des appels existants. */
export function tenantS3Key(_orgId: string | null | undefined, relativePath: string): string {
  return s3Key(relativePath);
}

export function tenantReadKeys(_orgId: string | null | undefined, relativePath: string): string[] {
  return [s3Key(relativePath)];
}

export function isTenantScopedS3Key(key: string): boolean {
  return key.replace(/^\/+/, "").startsWith("tenants/");
}

export function normalizeS3KeyForTenantWrite(_orgId: string, key: string): string {
  return s3Key(key);
}

/**
 * Multi-tenant SaaS : 1 organisation Clerk = 1 client, données sous tenants/{orgId}/ sur S3.
 */

export const TENANT_S3_PREFIX = "tenants";

/** orgId Clerk du tenant migré (données plates à la racine du bucket). */
export function getLegacyTenantOrgId(): string | null {
  const v = process.env.LEGACY_TENANT_ORG_ID?.trim();
  return v || null;
}

export function tenantS3Key(orgId: string, relativePath: string): string {
  const rel = relativePath.replace(/^\/+/, "");
  return `${TENANT_S3_PREFIX}/${orgId}/${rel}`;
}

/** Clé plate historique (avant migration). */
export function legacyFlatS3Key(relativePath: string): string {
  return relativePath.replace(/^\/+/, "");
}

/**
 * Pour une lecture : clé tenant si orgId fourni ; sinon legacy flat uniquement si org = LEGACY.
 */
export function tenantReadKeys(orgId: string | null | undefined, relativePath: string): string[] {
  const rel = relativePath.replace(/^\/+/, "");
  if (!orgId) return [legacyFlatS3Key(rel)];
  const keys = [tenantS3Key(orgId, rel)];
  const legacyOrg = getLegacyTenantOrgId();
  if (legacyOrg && orgId === legacyOrg) {
    keys.push(legacyFlatS3Key(rel));
  }
  return keys;
}

export function isTenantScopedS3Key(key: string): boolean {
  return key.startsWith(`${TENANT_S3_PREFIX}/`);
}

/** Réécrit une clé S3 lue (legacy ou tenant) en clé d'écriture pour le tenant courant. */
export function normalizeS3KeyForTenantWrite(orgId: string, key: string): string {
  const k = key.replace(/^\/+/, "");
  const prefix = `${TENANT_S3_PREFIX}/${orgId}/`;
  if (k.startsWith(prefix)) return k;
  const legacyOrg = getLegacyTenantOrgId();
  if (legacyOrg && orgId === legacyOrg) {
    if (!k.startsWith(`${TENANT_S3_PREFIX}/`)) return tenantS3Key(orgId, k);
  }
  return tenantS3Key(orgId, k);
}

/** Bucket S3 public — icônes modules, organigramme, voyages, rentrée, etc. */
export const SCOLA_IMAGE_BUCKET =
  process.env.IMAGE_BUCKET?.trim() || "scola-image";

/**
 * Host CDN du bucket images public.
 * Scaleway : <bucket>.s3.<region>.scw.cloud
 * Surchargeable via NEXT_PUBLIC_SCOLA_IMAGE_CDN_HOST pour les déploiements custom.
 */
export const SCOLA_IMAGE_CDN_HOST =
  process.env.NEXT_PUBLIC_SCOLA_IMAGE_CDN_HOST?.trim() ||
  `${SCOLA_IMAGE_BUCKET}.s3.fr-par.scw.cloud`;

export const SCOLA_IMAGE_CDN_BASE = `https://${SCOLA_IMAGE_CDN_HOST}`;

export function scolaImageUrl(path: string): string {
  const clean = String(path || "").replace(/^\//, "");
  return `${SCOLA_IMAGE_CDN_BASE}/${clean}`;
}

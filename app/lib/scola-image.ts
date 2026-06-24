/** Bucket S3 public — icônes modules, organigramme, voyages, rentrée, etc. */
export const SCOLA_IMAGE_BUCKET = "scola-image";

export const SCOLA_IMAGE_CDN_HOST = `${SCOLA_IMAGE_BUCKET}.s3.eu-west-3.amazonaws.com`;

export const SCOLA_IMAGE_CDN_BASE = `https://${SCOLA_IMAGE_CDN_HOST}`;

export function scolaImageUrl(path: string): string {
  const clean = String(path || "").replace(/^\//, "");
  return `${SCOLA_IMAGE_CDN_BASE}/${clean}`;
}

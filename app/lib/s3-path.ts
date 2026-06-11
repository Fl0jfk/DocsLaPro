/** Chemins S3 à la racine du bucket (une instance = un bucket dédié). */

export function s3Key(relativePath: string): string {
  return relativePath.replace(/^\/+/, "");
}

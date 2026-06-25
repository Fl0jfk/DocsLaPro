/** Helpers URL publiques fournitures — sans dépendance serveur (utilisable côté client). */

export function isAllowedFournituresS3Key(key: string): boolean {
  const k = key.replace(/^\/+/, "").replace(/\.\./g, "");
  return k.startsWith("toolbox/fournitures/");
}

export function fournituresPublicFileApiUrl(key: string): string {
  return `/api/fournitures/file?key=${encodeURIComponent(key.replace(/^\/+/, ""))}`;
}

function fournituresKeyFromPathHref(href: string): string | null {
  const t = href.trim();
  if (t.startsWith("/toolbox/fournitures/")) return t.replace(/^\//, "");
  if (t.startsWith("toolbox/fournitures/")) return t;
  return null;
}

function extractFournituresKeyFromS3Url(href: string): string | null {
  try {
    const path = decodeURIComponent(new URL(href).pathname.replace(/^\//, ""));
    const marker = "toolbox/fournitures/";
    const idx = path.indexOf(marker);
    if (idx !== -1) {
      const key = path.slice(idx).split("?")[0].split("#")[0];
      if (isAllowedFournituresS3Key(key)) return key;
    }
    if (isAllowedFournituresS3Key(path)) return path;
  } catch {
    /* ignore */
  }
  return null;
}

function isInternalAppRoute(href: string): boolean {
  if (!href.startsWith("/")) return false;
  if (href.startsWith("/toolbox/fournitures/")) return false;
  if (href.startsWith("/api/fournitures/file")) return false;
  return true;
}

/** Résolution synchrone (chemins relatifs, URLs S3 avec marker toolbox/fournitures/). */
export function resolveFournituresPublicHrefSync(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) return trimmed;

  if (isInternalAppRoute(trimmed)) return trimmed;

  const pathKey = fournituresKeyFromPathHref(trimmed);
  if (pathKey && isAllowedFournituresS3Key(pathKey)) {
    return fournituresPublicFileApiUrl(pathKey);
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const extracted = extractFournituresKeyFromS3Url(trimmed);
    if (extracted) return fournituresPublicFileApiUrl(extracted);
  }

  return trimmed;
}

/** Aperçu admin / liens déjà enregistrés. */
export function fournituresPreviewHref(href: string): string {
  return resolveFournituresPublicHrefSync(href);
}

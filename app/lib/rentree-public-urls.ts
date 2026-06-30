import "server-only";

import { scolaImageUrl } from "@/app/lib/scola-image";
import { rentreeKeyFromApiHref } from "@/app/lib/rentree-file-serve";
import { parseTravelsS3KeyFromUrl } from "@/app/lib/travels-s3";
import type { RentreeEstablishmentPage } from "@/app/lib/rentree-types";

const PUBLIC_S3_HOSTS = new Set(["scola-image.s3.eu-west-3.amazonaws.com"]);

/** Ancien bucket CDN (404) → bucket public scola-image. */
const LEGACY_RENTREE_CDN_HOSTS = new Set(["docslaproimage.s3.eu-west-3.amazonaws.com"]);

export function isAllowedRentreeS3Key(key: string): boolean {
  const k = key.replace(/^\/+/, "").replace(/\.\./g, "");
  return k.startsWith("documents/rentree/") || k.startsWith("toolbox/rentree/");
}

export function rentreePublicFileApiUrl(key: string): string {
  return `/api/rentree/file?key=${encodeURIComponent(key.replace(/^\/+/, ""))}`;
}

function rentreeKeyFromPathHref(href: string): string | null {
  const t = href.trim();
  if (t.startsWith("/documents/rentree/") || t.startsWith("/toolbox/rentree/")) {
    return t.replace(/^\//, "");
  }
  if (t.startsWith("documents/rentree/") || t.startsWith("toolbox/rentree/")) {
    return t;
  }
  return null;
}

function isInternalAppRoute(href: string): boolean {
  if (!href.startsWith("/")) return false;
  if (href.startsWith("/documents/rentree/")) return false;
  if (href.startsWith("/toolbox/rentree/")) return false;
  if (href.startsWith("/api/rentree/file")) return false;
  return true;
}

function isPublicExternalUrl(href: string): boolean {
  if (!href.startsWith("http://") && !href.startsWith("https://")) return false;
  try {
    return PUBLIC_S3_HOSTS.has(new URL(href).hostname);
  } catch {
    return false;
  }
}

function normalizeLegacyRentreeCdnUrl(href: string): string | null {
  try {
    const host = new URL(href).hostname;
    if (!LEGACY_RENTREE_CDN_HOSTS.has(host)) return null;
    return scolaImageUrl(new URL(href).pathname);
  } catch {
    return null;
  }
}

/** Extrait une clé rentrée depuis n'importe quelle URL S3 (bucket tenant ou autre). */
function extractRentreeKeyFromS3Url(href: string): string | null {
  try {
    const path = decodeURIComponent(new URL(href).pathname.replace(/^\//, ""));
    for (const marker of ["documents/rentree/", "toolbox/rentree/"] as const) {
      const idx = path.indexOf(marker);
      if (idx !== -1) {
        const key = path.slice(idx).split("?")[0].split("#")[0];
        if (isAllowedRentreeS3Key(key)) return key;
      }
    }
    if (isAllowedRentreeS3Key(path)) return path;
  } catch {
    /* ignore */
  }
  return null;
}

/** Transforme chemins S3 / URLs bucket privé en route publique signée. */
export async function resolveRentreePublicHref(
  href: string,
  kind?: "pdf" | "link",
): Promise<string> {
  const trimmed = href.trim();
  if (!trimmed) return trimmed;

  const fromApi = rentreeKeyFromApiHref(trimmed);
  if (fromApi) return rentreePublicHrefForKey(fromApi, kind);

  if (trimmed.startsWith("/rentree/document")) {
    try {
      const legacyKey = new URL(trimmed, "https://local.invalid").searchParams.get("key")?.trim() || "";
      if (legacyKey && isAllowedRentreeS3Key(legacyKey)) return rentreePublicFileApiUrl(legacyKey);
    } catch {
      /* ignore */
    }
  }

  if (isInternalAppRoute(trimmed)) return trimmed;

  const legacyCdn = normalizeLegacyRentreeCdnUrl(trimmed);
  if (legacyCdn) return legacyCdn;

  const pathKey = rentreeKeyFromPathHref(trimmed);
  if (pathKey && isAllowedRentreeS3Key(pathKey)) {
    return rentreePublicHrefForKey(pathKey, kind);
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (isPublicExternalUrl(trimmed)) return trimmed;

    const extracted = extractRentreeKeyFromS3Url(trimmed);
    if (extracted) return rentreePublicHrefForKey(extracted, kind);

    const parsedKey = await parseTravelsS3KeyFromUrl(trimmed);
    if (parsedKey && isAllowedRentreeS3Key(parsedKey)) {
      return rentreePublicHrefForKey(parsedKey, kind);
    }
    return trimmed;
  }

  return trimmed;
}

function rentreePublicHrefForKey(key: string, _kind?: "pdf" | "link"): string {
  return rentreePublicFileApiUrl(key);
}

export async function resolveRentreePagesPublicHrefs(
  pages: RentreeEstablishmentPage[],
): Promise<RentreeEstablishmentPage[]> {
  return Promise.all(
    pages.map(async (page) => ({
      ...page,
      sections: await Promise.all(
        page.sections.map(async (section) => ({
          ...section,
          items: await Promise.all(
            section.items.map(async (item) => ({
              ...item,
              href: await resolveRentreePublicHref(item.href, item.kind),
            })),
          ),
        })),
      ),
    })),
  );
}

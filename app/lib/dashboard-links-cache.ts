import type { ExternalQuickLink } from "@/app/lib/intranet-modules";

const STORAGE_KEY_PREFIX = "scola.dashboard-links:v1:";
const MAX_AGE_MS = 15 * 60 * 1000;

type DashboardLinksCache = {
  links: ExternalQuickLink[];
  savedAt: number;
};

function storageKey(): string | null {
  if (typeof window === "undefined") return null;
  return `${STORAGE_KEY_PREFIX}${window.location.hostname}`;
}

export function readDashboardLinksCache(): ExternalQuickLink[] | null {
  const key = storageKey();
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DashboardLinksCache;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return Array.isArray(parsed.links) ? parsed.links : null;
  } catch {
    return null;
  }
}

export function writeDashboardLinksCache(links: ExternalQuickLink[]): void {
  const key = storageKey();
  if (!key) return;
  try {
    const payload: DashboardLinksCache = { links, savedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearDashboardLinksCache(): void {
  const key = storageKey();
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

const STORAGE_KEY = "scola.portal.lastTenant";

export type SavedPortalTenant = {
  slug: string;
  label: string;
  signInUrl: string;
  savedAt: number;
};

export function saveLastPortalTenant(entry: {
  slug: string;
  label: string;
  signInUrl: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const payload: SavedPortalTenant = { ...entry, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / mode privé */
  }
}

export function readLastPortalTenant(): SavedPortalTenant | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedPortalTenant;
    if (!parsed?.slug || !parsed.signInUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLastPortalTenant(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Vérifie que le tenant mémorisé existe encore dans le catalogue. */
export async function resolveSavedPortalTenantSignIn(): Promise<string | null> {
  const saved = readLastPortalTenant();
  if (!saved) return null;
  try {
    const res = await fetch("/api/tenants/public", { cache: "no-store" });
    const j = await res.json();
    if (!res.ok) return null;
    const hit = (j.tenants as { slug: string; signInUrl: string }[] | undefined)?.find(
      (t) => t.slug === saved.slug,
    );
    return hit?.signInUrl ?? null;
  } catch {
    return saved.signInUrl;
  }
}

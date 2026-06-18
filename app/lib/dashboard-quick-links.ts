export const MAX_DASHBOARD_QUICK_LINKS = 3;

export type DashboardQuickLink = {
  id: string;
  name: string;
  link: string;
  img: string;
};

const STORAGE_VERSION = 1;

export function quickLinksStorageKey(userId: string | null | undefined): string {
  const who = userId?.trim() || "anon";
  return `scola-dashboard-quick-links:v${STORAGE_VERSION}:${who}`;
}

export function normalizeQuickLinks(links: DashboardQuickLink[]): DashboardQuickLink[] {
  return links
    .map((l, i) => ({
      id: l.id?.trim() || `link-${i}`,
      name: l.name.trim(),
      link: l.link.trim(),
      img: l.img.trim(),
    }))
    .filter((l) => l.name && l.link)
    .slice(0, MAX_DASHBOARD_QUICK_LINKS);
}

export function loadQuickLinks(
  userId: string | null | undefined,
): { links: DashboardQuickLink[]; fromStorage: boolean } {
  if (typeof window === "undefined") return { links: [], fromStorage: false };
  try {
    const raw = localStorage.getItem(quickLinksStorageKey(userId));
    if (!raw) return { links: [], fromStorage: false };
    const parsed = JSON.parse(raw) as DashboardQuickLink[];
    if (!Array.isArray(parsed)) return { links: [], fromStorage: false };
    return { links: normalizeQuickLinks(parsed), fromStorage: true };
  } catch {
    return { links: [], fromStorage: false };
  }
}

export function saveQuickLinks(userId: string | null | undefined, links: DashboardQuickLink[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(quickLinksStorageKey(userId), JSON.stringify(normalizeQuickLinks(links)));
  } catch {
    /* ignore */
  }
}

export function clearQuickLinks(userId: string | null | undefined): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(quickLinksStorageKey(userId));
  } catch {
    /* ignore */
  }
}

export function emptyQuickLinkSlot(index: number): DashboardQuickLink {
  return { id: `slot-${index}`, name: "", link: "", img: "" };
}

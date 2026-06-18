const STORAGE_KEY = "scola-recent-docs-v1";
const MAX = 12;

export type RecentDoc = {
  relPath: string;
  name: string;
  openedAt: number;
};

export function getRecentDocs(): RecentDoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentDoc[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecentDoc(doc: Omit<RecentDoc, "openedAt">) {
  if (typeof window === "undefined") return;
  const next = [
    { ...doc, openedAt: Date.now() },
    ...getRecentDocs().filter((d) => d.relPath !== doc.relPath),
  ].slice(0, MAX);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

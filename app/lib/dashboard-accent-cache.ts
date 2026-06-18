import {
  dashboardBrandCssVars,
  parseDashboardAccent,
  type DashboardAccent,
} from "@/app/lib/dashboard-brand-presets";

const STORAGE_KEY = "scola-dashboard-accent:v1";

export function readCachedDashboardAccent(): DashboardAccent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseDashboardAccent(raw);
  } catch {
    return null;
  }
}

export function writeCachedDashboardAccent(accent: DashboardAccent): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, accent);
  } catch {
    /* quota / mode privé */
  }
}

export function applyDashboardBrandToDocument(accent?: string | null): void {
  if (typeof document === "undefined") return;
  const vars = dashboardBrandCssVars(parseDashboardAccent(accent));
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

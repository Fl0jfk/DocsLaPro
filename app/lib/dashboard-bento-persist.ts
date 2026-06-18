import { getBentoSpan, type BentoSpan } from "@/app/lib/dashboard-bento-layout";
import { clampModuleSpan } from "@/app/lib/dashboard-bento-constraints";
import { packModules, type GridPosition } from "@/app/lib/dashboard-bento-grid";
import { DASHBOARD_WEEK_SHEET_MODULE_ID } from "@/app/lib/dashboard-week-sheet-types";

const STORAGE_VERSION = 4;

export type SavedBentoLayout = {
  order: string[];
  spans: Record<string, { colSpan: number; rowSpan: number }>;
  positions: Record<string, GridPosition>;
  hidden: string[];
};

function normalizeWeekSheetSpan(
  moduleIds: string[],
  spans: SavedBentoLayout["spans"],
): void {
  if (!moduleIds.includes(DASHBOARD_WEEK_SHEET_MODULE_ID)) return;
  spans[DASHBOARD_WEEK_SHEET_MODULE_ID] = clampModuleSpan(
    DASHBOARD_WEEK_SHEET_MODULE_ID,
    spans[DASHBOARD_WEEK_SHEET_MODULE_ID]?.colSpan ?? 12,
    spans[DASHBOARD_WEEK_SHEET_MODULE_ID]?.rowSpan ?? 1,
  );
}

/** Réaligne tailles liées (sans imposer la position de la feuille de semaine). */
export function applyLayoutNormalizers(moduleIds: string[], layout: SavedBentoLayout): SavedBentoLayout {
  const spans = { ...layout.spans };
  if (moduleIds.includes("domain-planning") && moduleIds.includes("prof-room")) {
    const roomSpan = spans["prof-room"];
    if (roomSpan) {
      spans["domain-planning"] = clampModuleSpan(
        "domain-planning",
        roomSpan.colSpan,
        roomSpan.rowSpan,
      );
    }
  }
  normalizeWeekSheetSpan(moduleIds, spans);
  return { ...layout, spans };
}

export function bentoLayoutStorageKey(userId: string | null | undefined): string {
  const who = userId?.trim() || "anon";
  return `scola-bento-layout:v${STORAGE_VERSION}:${who}`;
}

export function buildDefaultLayout(moduleIds: string[]): SavedBentoLayout {
  const sorted = [...moduleIds].sort((a, b) => {
    const sa = getBentoSpan(a).sort;
    const sb = getBentoSpan(b).sort;
    return sa - sb || a.localeCompare(b);
  });
  const spans: SavedBentoLayout["spans"] = {};
  for (const id of moduleIds) {
    const d = getBentoSpan(id);
    spans[id] = clampModuleSpan(id, d.colSpan, d.rowSpan);
  }
  const positions = packModules(sorted, spans, new Set());
  return applyLayoutNormalizers(moduleIds, { order: sorted, spans, positions, hidden: [] });
}

export function mergeSavedLayout(moduleIds: string[], saved: SavedBentoLayout | null): SavedBentoLayout {
  const defaults = buildDefaultLayout(moduleIds);
  if (!saved) return defaults;

  const order = [
    ...saved.order.filter((id) => moduleIds.includes(id)),
    ...moduleIds.filter((id) => !saved.order.includes(id)),
  ];

  const spans: SavedBentoLayout["spans"] = { ...defaults.spans };
  for (const id of moduleIds) {
    const hit = saved.spans[id];
    if (hit) spans[id] = clampModuleSpan(id, hit.colSpan, hit.rowSpan);
  }

  const hidden = Array.isArray(saved.hidden)
    ? saved.hidden.filter((id) => moduleIds.includes(id))
    : [];

  const hiddenSet = new Set(hidden);
  const visibleOrder = order.filter((id) => !hiddenSet.has(id));

  let positions: Record<string, GridPosition> = {};
  if (saved.positions && typeof saved.positions === "object") {
    for (const id of visibleOrder) {
      const hit = saved.positions[id];
      if (hit && hit.col >= 1 && hit.row >= 1) {
        positions[id] = { col: hit.col, row: hit.row };
      }
    }
  }

  if (visibleOrder.some((id) => !positions[id])) {
    const packed = packModules(visibleOrder, spans, hiddenSet);
    for (const id of visibleOrder) {
      if (!positions[id]) positions[id] = packed[id];
    }
  }

  return applyLayoutNormalizers(moduleIds, { order, spans, positions, hidden });
}

export function loadSavedBentoLayout(userId: string | null | undefined): SavedBentoLayout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(bentoLayoutStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedBentoLayout;
    if (!Array.isArray(parsed.order) || typeof parsed.spans !== "object") return null;
    return {
      ...parsed,
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
      positions: parsed.positions && typeof parsed.positions === "object" ? parsed.positions : {},
    };
  } catch {
    return null;
  }
}

export function saveSavedBentoLayout(userId: string | null | undefined, layout: SavedBentoLayout): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(bentoLayoutStorageKey(userId), JSON.stringify(layout));
  } catch {
    /* quota / private mode */
  }
}

export function clearSavedBentoLayout(userId: string | null | undefined): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(bentoLayoutStorageKey(userId));
  } catch {
    /* ignore */
  }
}

export function getLayoutSpan(layout: SavedBentoLayout, moduleId: string): Pick<BentoSpan, "colSpan" | "rowSpan"> {
  const base = layout.spans[moduleId] ?? {
    colSpan: getBentoSpan(moduleId).colSpan,
    rowSpan: getBentoSpan(moduleId).rowSpan,
  };
  return clampModuleSpan(moduleId, base.colSpan, base.rowSpan);
}

export function getLayoutPosition(layout: SavedBentoLayout, moduleId: string): GridPosition {
  return layout.positions[moduleId] ?? { col: 1, row: 1 };
}

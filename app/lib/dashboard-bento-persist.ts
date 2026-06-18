import {
  filterBentoGridModuleIds,
  isBentoFooterAdminModule,
  isBentoPinnedFooterModule,
} from "@/app/lib/dashboard-bento-constraints";
import {
  DESKTOP_BENTO_COLUMN_COUNT,
  emptyBentoColumns,
  linearOrderToColumns,
  mergeNewModulesIntoColumns,
} from "@/app/lib/dashboard-bento-columns";
import { defaultBentoModuleColumns } from "@/app/lib/dashboard-bento-layout";

const STORAGE_VERSION = 8;

export type SavedBentoLayout = {
  columns: string[][];
  hidden: string[];
};

type LegacySavedLayout = {
  columns?: string[][];
  order?: string[];
  hidden?: string[];
  spans?: unknown;
  positions?: unknown;
};

export function bentoLayoutStorageKey(userId: string | null | undefined): string {
  const who = userId?.trim() || "anon";
  return `scola-bento-layout:v${STORAGE_VERSION}:${who}`;
}

function stripNonGridModules(ids: string[]): string[] {
  return ids.filter(
    (id) => !isBentoFooterAdminModule(id) && !isBentoPinnedFooterModule(id),
  );
}

function normalizeColumns(raw: string[][] | undefined): string[][] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const columns = emptyBentoColumns(DESKTOP_BENTO_COLUMN_COUNT);
  for (let col = 0; col < DESKTOP_BENTO_COLUMN_COUNT; col++) {
    if (Array.isArray(raw[col])) {
      columns[col] = stripNonGridModules(raw[col]);
    }
  }

  return columns;
}

function columnsFromLegacyOrder(order: string[]): string[][] {
  return linearOrderToColumns(stripNonGridModules(order), DESKTOP_BENTO_COLUMN_COUNT);
}

function normalizeSavedLayout(raw: LegacySavedLayout, moduleIds: string[]): SavedBentoLayout | null {
  const gridIds = filterBentoGridModuleIds(moduleIds);
  const hidden = Array.isArray(raw.hidden)
    ? stripNonGridModules(raw.hidden).filter((id) => gridIds.includes(id))
    : [];

  const fromColumns = normalizeColumns(raw.columns);
  if (fromColumns) {
    return finalizeLayout(fromColumns, hidden, gridIds);
  }

  if (Array.isArray(raw.order)) {
    return finalizeLayout(columnsFromLegacyOrder(raw.order), hidden, gridIds);
  }

  return null;
}

function finalizeLayout(
  columns: string[][],
  hidden: string[],
  gridIds: string[],
): SavedBentoLayout {
  const hiddenSet = new Set(hidden);
  const merged = mergeNewModulesIntoColumns(columns, gridIds, hiddenSet);

  return {
    columns: merged,
    hidden: hidden.filter((id) => !isBentoFooterAdminModule(id)),
  };
}

export function buildDefaultLayout(moduleIds: string[]): SavedBentoLayout {
  const gridIds = filterBentoGridModuleIds(moduleIds);
  return finalizeLayout(defaultBentoModuleColumns(gridIds), [], gridIds);
}

export function mergeSavedLayout(moduleIds: string[], saved: SavedBentoLayout | null): SavedBentoLayout {
  const gridIds = filterBentoGridModuleIds(moduleIds);
  const defaults = buildDefaultLayout(gridIds);
  if (!saved) return defaults;

  return finalizeLayout(saved.columns, saved.hidden, gridIds);
}

export function loadAndMergeBentoLayout(
  userId: string | null | undefined,
  moduleIds: string[],
): SavedBentoLayout {
  if (typeof window === "undefined") return buildDefaultLayout(moduleIds);

  try {
    const who = userId?.trim() || "anon";
    const currentKey = bentoLayoutStorageKey(userId);
    const rawV8 = localStorage.getItem(currentKey);
    if (rawV8) {
      const parsed = JSON.parse(rawV8) as LegacySavedLayout;
      const normalized = normalizeSavedLayout(parsed, moduleIds);
      if (normalized) return mergeSavedLayout(moduleIds, normalized);
    }

    for (const version of [7, 6, 5] as const) {
      const legacyKey = `scola-bento-layout:v${version}:${who}`;
      const legacyRaw = localStorage.getItem(legacyKey);
      if (!legacyRaw) continue;
      const legacy = JSON.parse(legacyRaw) as LegacySavedLayout;
      const normalized = normalizeSavedLayout(legacy, moduleIds);
      if (normalized) {
        const merged = mergeSavedLayout(moduleIds, normalized);
        saveSavedBentoLayout(userId, merged);
        return merged;
      }
    }

    for (let v = 4; v >= 1; v--) {
      const legacyKey = `scola-bento-layout:v${v}:${who}`;
      const legacyRaw = localStorage.getItem(legacyKey);
      if (!legacyRaw) continue;
      const legacy = JSON.parse(legacyRaw) as LegacySavedLayout;
      const normalized = normalizeSavedLayout(legacy, moduleIds);
      if (normalized) {
        const merged = mergeSavedLayout(moduleIds, normalized);
        saveSavedBentoLayout(userId, merged);
        return merged;
      }
    }
  } catch {
    /* ignore */
  }

  return buildDefaultLayout(moduleIds);
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
    const who = userId?.trim() || "anon";
    for (let v = 7; v >= 1; v--) {
      localStorage.removeItem(`scola-bento-layout:v${v}:${who}`);
    }
  } catch {
    /* ignore */
  }
}

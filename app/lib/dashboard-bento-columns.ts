import type { DashboardViewport } from "@/app/lib/bento-widget-size";

/** Le bureau utilise 3 colonnes indépendantes. */
export const DESKTOP_BENTO_COLUMN_COUNT = 3;

export function emptyBentoColumns(columnCount = DESKTOP_BENTO_COLUMN_COUNT): string[][] {
  return Array.from({ length: columnCount }, () => []);
}

/** Ancien ordre linéaire (ligne par ligne) → 3 colonnes. */
export function linearOrderToColumns(
  order: string[],
  columnCount = DESKTOP_BENTO_COLUMN_COUNT,
): string[][] {
  const columns = emptyBentoColumns(columnCount);
  order.forEach((moduleId, index) => {
    columns[index % columnCount].push(moduleId);
  });
  return columns;
}

export function flattenBentoColumns(columns: string[][]): string[] {
  return columns.flat();
}

export function filterHiddenFromColumns(
  columns: string[][],
  hidden: ReadonlySet<string>,
): string[][] {
  return columns.map((col) => col.filter((id) => !hidden.has(id)));
}

/** Bureau → tablette (col.1 | col.2+3) → mobile (tout empilé). */
export function columnsForViewport(
  desktopColumns: string[][],
  viewport: DashboardViewport,
): string[][] {
  const c0 = desktopColumns[0] ?? [];
  const c1 = desktopColumns[1] ?? [];
  const c2 = desktopColumns[2] ?? [];

  if (viewport === "desktop") return [c0, c1, c2];
  if (viewport === "tablet") return [c0, [...c1, ...c2]];
  return [[...c0, ...c1, ...c2]];
}

export function removeModuleFromColumns(
  columns: string[][],
  moduleId: string,
): string[][] {
  return columns.map((col) => col.filter((id) => id !== moduleId));
}

/**
 * Déplace un module dans `targetCol` à la ligne `targetRow` (0 = haut).
 * Les autres colonnes ne bougent pas.
 */
export function placeModuleInColumns(
  columns: string[][],
  moduleId: string,
  targetCol: number,
  targetRow: number,
): string[][] {
  const next = removeModuleFromColumns(columns, moduleId).map((col) => [...col]);
  const col = next[targetCol] ?? [];

  if (targetRow >= col.length) {
    col.push(moduleId);
  } else {
    col.splice(targetRow, 0, moduleId);
  }

  next[targetCol] = col;
  return next;
}

export function shortestColumnIndex(columns: string[][]): number {
  if (columns.length === 0) return 0;
  return columns.reduce(
    (min, col, index, all) => (col.length < all[min].length ? index : min),
    0,
  );
}

/** Ajoute les nouveaux modules dans la colonne la plus courte. */
export function mergeNewModulesIntoColumns(
  columns: string[][],
  moduleIds: string[],
  hidden: ReadonlySet<string>,
): string[][] {
  const allowed = new Set(moduleIds);
  const next = columns.map((col) => col.filter((id) => allowed.has(id)));
  const placed = new Set(next.flat());

  for (const moduleId of moduleIds) {
    if (placed.has(moduleId) || hidden.has(moduleId)) continue;
    const colIndex = shortestColumnIndex(next);
    next[colIndex].push(moduleId);
    placed.add(moduleId);
  }

  return next;
}

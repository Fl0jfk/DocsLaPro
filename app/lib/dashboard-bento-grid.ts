import {
  clampModuleSpan,
  getAllowedColSpans,
  getAllowedRowSpans,
} from "@/app/lib/dashboard-bento-constraints";

export type GridPosition = { col: number; row: number };
export type GridSpan = { colSpan: number; rowSpan: number };

export const GRID_COLS = 12;
export const MIN_COL_SPAN = 3;
export const MIN_ROW_SPAN = 2;

export function clampColStart(col: number, colSpan: number): number {
  const maxStart = GRID_COLS - colSpan + 1;
  return Math.max(1, Math.min(col, maxStart));
}

function rectsOverlap(
  a: GridPosition & GridSpan,
  b: GridPosition & GridSpan,
): boolean {
  const aColEnd = a.col + a.colSpan;
  const bColEnd = b.col + b.colSpan;
  const aRowEnd = a.row + a.rowSpan;
  const bRowEnd = b.row + b.rowSpan;
  return a.col < bColEnd && aColEnd > b.col && a.row < bRowEnd && aRowEnd > b.row;
}

export function hasGridCollision(
  positions: Record<string, GridPosition>,
  spans: Record<string, GridSpan>,
  ignoreId: string,
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number,
): boolean {
  const candidate = { col, row, colSpan, rowSpan };
  for (const [id, pos] of Object.entries(positions)) {
    if (id === ignoreId) continue;
    const span = spans[id];
    if (!span) continue;
    if (rectsOverlap(candidate, { ...pos, ...span })) return true;
  }
  return false;
}

function spanVariants(moduleId: string, current: GridSpan): GridSpan[] {
  const cols = getAllowedColSpans(moduleId);
  const rows = getAllowedRowSpans(moduleId);
  const out: GridSpan[] = [];
  const seen = new Set<string>();
  for (const c of cols) {
    if (c > current.colSpan) continue;
    for (const r of rows) {
      if (r > current.rowSpan) continue;
      const key = `${c}x${r}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ colSpan: c, rowSpan: r });
    }
  }
  out.sort((a, b) => b.colSpan * b.rowSpan - a.colSpan * a.rowSpan);
  return out;
}

export function packModules(
  order: string[],
  spans: Record<string, GridSpan>,
  hidden: Set<string>,
): Record<string, GridPosition> {
  const positions: Record<string, GridPosition> = {};
  for (const id of order) {
    if (hidden.has(id)) continue;
    const span = spans[id];
    if (!span) continue;
    const placed = findFirstFreeSlot(positions, spans, id, span, 1, 1);
    positions[id] = { col: placed.col, row: placed.row };
  }
  return positions;
}

function findFirstFreeSlot(
  positions: Record<string, GridPosition>,
  spans: Record<string, GridSpan>,
  moduleId: string,
  span: GridSpan,
  startRow: number,
  startCol: number,
): GridPosition & GridSpan {
  for (let row = startRow; row < startRow + 48; row++) {
    for (let col = startCol; col <= GRID_COLS - span.colSpan + 1; col++) {
      if (!hasGridCollision(positions, spans, moduleId, col, row, span.colSpan, span.rowSpan)) {
        return { col, row, colSpan: span.colSpan, rowSpan: span.rowSpan };
      }
    }
    startCol = 1;
  }
  return { col: 1, row: startRow, colSpan: span.colSpan, rowSpan: span.rowSpan };
}

/** Place un module à l'emplacement visé ; réduit si besoin (min 3×2). */
export function resolveGridPlacement(
  positions: Record<string, GridPosition>,
  spans: Record<string, GridSpan>,
  moduleId: string,
  preferredCol: number,
  preferredRow: number,
): { col: number; row: number; colSpan: number; rowSpan: number } {
  const base = clampModuleSpan(moduleId, spans[moduleId].colSpan, spans[moduleId].rowSpan);
  const row0 = Math.max(1, preferredRow);

  for (const variant of spanVariants(moduleId, base)) {
    const col0 = clampColStart(preferredCol, variant.colSpan);

    for (let row = row0; row < row0 + 40; row++) {
      if (
        !hasGridCollision(positions, spans, moduleId, col0, row, variant.colSpan, variant.rowSpan)
      ) {
        return { col: col0, row, ...variant };
      }
    }

    for (let row = row0; row < row0 + 40; row++) {
      for (let col = 1; col <= GRID_COLS - variant.colSpan + 1; col++) {
        if (!hasGridCollision(positions, spans, moduleId, col, row, variant.colSpan, variant.rowSpan)) {
          return { col, row, ...variant };
        }
      }
    }
  }

  const fallback = findFirstFreeSlot(positions, spans, moduleId, base, row0, 1);
  return fallback;
}

export function pointerToGridCell(
  gridRect: DOMRect,
  clientX: number,
  clientY: number,
  colUnit: number,
  rowUnit: number,
  gap: number,
  padding = 0,
): GridPosition {
  const x = clientX - gridRect.left - padding;
  const y = clientY - gridRect.top - padding;

  let col = 1;
  for (let c = 1; c <= GRID_COLS; c++) {
    const start = (c - 1) * (colUnit + gap);
    if (x < start + colUnit) {
      col = c;
      break;
    }
    if (c === GRID_COLS) col = GRID_COLS;
  }

  const row = Math.max(1, Math.floor(y / (rowUnit + gap)) + 1);
  return { col, row };
}

export function maxOccupiedRow(
  positions: Record<string, GridPosition>,
  spans: Record<string, GridSpan>,
  moduleIds: string[],
): number {
  let max = 4;
  for (const id of moduleIds) {
    const pos = positions[id];
    const span = spans[id];
    if (!pos || !span) continue;
    max = Math.max(max, pos.row + span.rowSpan);
  }
  return max;
}

export function gridPlacementStylePlain(
  pos: GridPosition,
  span: GridSpan,
  options?: { rowSpan?: number; alignStart?: boolean },
): { gridColumn: string; gridRow: string; alignSelf?: string } {
  const rowSpan = options?.rowSpan ?? span.rowSpan;
  return {
    gridColumn: `${pos.col} / span ${span.colSpan}`,
    gridRow: `${pos.row} / span ${rowSpan}`,
    ...(options?.alignStart ? { alignSelf: "start" } : {}),
  };
}

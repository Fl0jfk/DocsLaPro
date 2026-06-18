import { DASHBOARD_WEEK_SHEET_MODULE_ID } from "@/app/lib/dashboard-week-sheet-types";
import { BENTO_COL_OPTIONS, BENTO_ROW_OPTIONS } from "@/app/lib/dashboard-bento-layout";

export const WEEK_SHEET_BENTO_SPAN = { colSpan: 12, rowSpan: 1 } as const;

export type BentoSizeConstraints = {
  minColSpan?: number;
  maxColSpan?: number;
  minRowSpan?: number;
  maxRowSpan?: number;
};

/** Limites par module : certains ne peuvent pas grossir, d'autres pas trop rétrécir. */
export const BENTO_SIZE_CONSTRAINTS: Record<string, BentoSizeConstraints> = {
  "agent-ia-ocr": { minColSpan: 3, maxColSpan: 6, minRowSpan: 2, maxRowSpan: 2 },
  qrcreator: { minColSpan: 3, maxColSpan: 4, minRowSpan: 2, maxRowSpan: 2 },
  documents: { minColSpan: 3, maxColSpan: 6, minRowSpan: 2, maxRowSpan: 4 },
  travels: { minColSpan: 3, maxColSpan: 6, minRowSpan: 2, maxRowSpan: 4 },
  absences: { minColSpan: 3, maxColSpan: 6, minRowSpan: 2, maxRowSpan: 4 },
  "prof-room": { minColSpan: 3, maxColSpan: 6, minRowSpan: 2, maxRowSpan: 4 },
  "requests-staff": { minColSpan: 3, maxColSpan: 6, minRowSpan: 2, maxRowSpan: 4 },
  "domain-planning": { minColSpan: 3, maxColSpan: 6, minRowSpan: 2, maxRowSpan: 4 },
  internat: { minColSpan: 3, maxColSpan: 6, minRowSpan: 2, maxRowSpan: 3 },
  rh: { minColSpan: 3, maxColSpan: 4, minRowSpan: 2, maxRowSpan: 3 },
  channels: { minColSpan: 3, maxColSpan: 4, minRowSpan: 2, maxRowSpan: 2 },
  organigramme: { minColSpan: 3, maxColSpan: 4, minRowSpan: 2, maxRowSpan: 2 },
  "chatbot-knowledge": { minColSpan: 3, maxColSpan: 6, minRowSpan: 2, maxRowSpan: 3 },
  "photocopies-couleur": { minColSpan: 3, maxColSpan: 6, minRowSpan: 2, maxRowSpan: 3 },
  "demandes-hse": { minColSpan: 3, maxColSpan: 6, minRowSpan: 2, maxRowSpan: 3 },
  covoiturage: { minColSpan: 3, maxColSpan: 6, minRowSpan: 2, maxRowSpan: 3 },
  "admin-settings": { minColSpan: 3, maxColSpan: 4, minRowSpan: 2, maxRowSpan: 2 },
  "admin-members": { minColSpan: 3, maxColSpan: 4, minRowSpan: 2, maxRowSpan: 2 },
  "dashboard-week-sheet": {
    minColSpan: WEEK_SHEET_BENTO_SPAN.colSpan,
    maxColSpan: WEEK_SHEET_BENTO_SPAN.colSpan,
    minRowSpan: WEEK_SHEET_BENTO_SPAN.rowSpan,
    maxRowSpan: WEEK_SHEET_BENTO_SPAN.rowSpan,
  },
};

const DEFAULT_CONSTRAINTS: BentoSizeConstraints = {
  minColSpan: 3,
  maxColSpan: 6,
  minRowSpan: 2,
  maxRowSpan: 4,
};

export function isWeekSheetModule(moduleId: string): boolean {
  return moduleId === DASHBOARD_WEEK_SHEET_MODULE_ID;
}

export function getSizeConstraints(moduleId: string): BentoSizeConstraints {
  return BENTO_SIZE_CONSTRAINTS[moduleId] ?? DEFAULT_CONSTRAINTS;
}

export function getAllowedColSpans(moduleId: string): number[] {
  const c = getSizeConstraints(moduleId);
  return BENTO_COL_OPTIONS.filter(
    (n) => (!c.minColSpan || n >= c.minColSpan) && (!c.maxColSpan || n <= c.maxColSpan),
  );
}

export function getAllowedRowSpans(moduleId: string): number[] {
  const c = getSizeConstraints(moduleId);
  return BENTO_ROW_OPTIONS.filter(
    (n) => (!c.minRowSpan || n >= c.minRowSpan) && (!c.maxRowSpan || n <= c.maxRowSpan),
  );
}

export function canResizeCol(moduleId: string): boolean {
  return getAllowedColSpans(moduleId).length > 1;
}

export function canResizeRow(moduleId: string): boolean {
  return getAllowedRowSpans(moduleId).length > 1;
}

export function clampModuleSpan(
  moduleId: string,
  colSpan: number,
  rowSpan: number,
): { colSpan: number; rowSpan: number } {
  const cols = getAllowedColSpans(moduleId);
  const rows = getAllowedRowSpans(moduleId);
  const pick = (value: number, allowed: number[]) => {
    if (allowed.includes(value)) return value;
    return allowed.reduce((best, n) => (Math.abs(n - value) < Math.abs(best - value) ? n : best), allowed[0]);
  };
  return {
    colSpan: pick(colSpan, cols.length ? cols : [colSpan]),
    rowSpan: pick(rowSpan, rows.length ? rows : [rowSpan]),
  };
}

export function resizeColByDrag(
  moduleId: string,
  startCol: number,
  deltaPx: number,
  colUnitPx: number,
): number {
  const allowed = getAllowedColSpans(moduleId);
  if (allowed.length <= 1 || colUnitPx <= 0) return startCol;
  const startIdx = Math.max(0, allowed.indexOf(startCol));
  const steps = Math.round(deltaPx / colUnitPx);
  const nextIdx = Math.max(0, Math.min(allowed.length - 1, startIdx + steps));
  return allowed[nextIdx];
}

export function resizeRowByDrag(
  moduleId: string,
  startRow: number,
  deltaPx: number,
  rowUnitPx: number,
): number {
  const allowed = getAllowedRowSpans(moduleId);
  if (allowed.length <= 1 || rowUnitPx <= 0) return startRow;
  const startIdx = Math.max(0, allowed.indexOf(startRow));
  const steps = Math.round(deltaPx / rowUnitPx);
  const nextIdx = Math.max(0, Math.min(allowed.length - 1, startIdx + steps));
  return allowed[nextIdx];
}

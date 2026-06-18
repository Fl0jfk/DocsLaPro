/**
 * Grille bento du dashboard (12 colonnes desktop).
 * Layout personnalisable : localStorage par utilisateur (voir dashboard-bento-persist.ts).
 */
import { DASHBOARD_WEEK_SHEET_MODULE_ID } from "@/app/lib/dashboard-week-sheet-types";

export type BentoSpan = { colSpan: number; rowSpan: number; sort: number };

const DEFAULT: BentoSpan = { colSpan: 4, rowSpan: 2, sort: 50 };

export const BENTO_LAYOUT: Record<string, BentoSpan> = {
  documents: { colSpan: 6, rowSpan: 3, sort: 1 },
  travels: { colSpan: 6, rowSpan: 3, sort: 2 },
  "agent-ia-ocr": { colSpan: 6, rowSpan: 2, sort: 3 },
  "prof-room": { colSpan: 6, rowSpan: 3, sort: 4 },
  "requests-staff": { colSpan: 6, rowSpan: 3, sort: 5 },
  absences: { colSpan: 6, rowSpan: 3, sort: 6 },
  "domain-planning": { colSpan: 4, rowSpan: 3, sort: 7 },
  internat: { colSpan: 4, rowSpan: 3, sort: 8 },
  rh: { colSpan: 4, rowSpan: 3, sort: 9 },
  channels: { colSpan: 3, rowSpan: 2, sort: 40 },
  organigramme: { colSpan: 3, rowSpan: 2, sort: 41 },
  qrcreator: { colSpan: 3, rowSpan: 2, sort: 90 },
  "chatbot-knowledge": { colSpan: 4, rowSpan: 2, sort: 42 },
  "photocopies-couleur": { colSpan: 4, rowSpan: 2, sort: 43 },
  "demandes-hse": { colSpan: 4, rowSpan: 2, sort: 44 },
  covoiturage: { colSpan: 4, rowSpan: 2, sort: 45 },
  "admin-settings": { colSpan: 3, rowSpan: 2, sort: 80 },
  "admin-members": { colSpan: 3, rowSpan: 2, sort: 81 },
  [DASHBOARD_WEEK_SHEET_MODULE_ID]: { colSpan: 12, rowSpan: 10, sort: 99 },
};

export function getBentoSpan(moduleId: string): BentoSpan {
  return BENTO_LAYOUT[moduleId] ?? DEFAULT;
}

export function colSpanClass(n: number): string {
  const map: Record<number, string> = {
    3: "lg:col-span-3",
    4: "lg:col-span-4",
    6: "lg:col-span-6",
    8: "lg:col-span-8",
    12: "lg:col-span-12",
  };
  return map[n] ?? "lg:col-span-4";
}

export function rowSpanClass(n: number): string {
  const map: Record<number, string> = {
    2: "lg:row-span-2",
    3: "lg:row-span-3",
    4: "lg:row-span-4",
    5: "lg:row-span-5",
    6: "lg:row-span-6",
    7: "lg:row-span-7",
    8: "lg:row-span-8",
    9: "lg:row-span-9",
    10: "lg:row-span-10",
  };
  return map[n] ?? "lg:row-span-2";
}

export const BENTO_COL_OPTIONS = [3, 4, 6, 12] as const;
export const BENTO_ROW_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

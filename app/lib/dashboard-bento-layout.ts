/**
 * Ordre par défaut des modules (référence pour la disposition initiale en 3 colonnes).
 * La feuille de semaine est hors grille (pied de page fixe).
 */
import { DASHBOARD_ACADEMIC_DEADLINES_MODULE_ID } from "@/app/lib/dashboard-academic-deadlines-types";
import {
  DESKTOP_BENTO_COLUMN_COUNT,
  linearOrderToColumns,
} from "@/app/lib/dashboard-bento-columns";

const DEFAULT_SORT = 50;

export const BENTO_DEFAULT_ORDER: string[] = [
  "documents",
  "travels",
  "agent-ia-ocr",
  "prof-room",
  DASHBOARD_ACADEMIC_DEADLINES_MODULE_ID,
  "rh",
  "channels",
  "internat",
  "requests-staff",
  "organigramme",
  "toolbox",
  "domain-planning",
  "covoiturage",
  "assistance",
];

export const BENTO_MODULE_SORT: Record<string, number> = {
  documents: 1,
  travels: 2,
  "agent-ia-ocr": 3,
  "prof-room": 4,
  [DASHBOARD_ACADEMIC_DEADLINES_MODULE_ID]: 5,
  rh: 6,
  channels: 7,
  internat: 8,
  "requests-staff": 9,
  organigramme: 10,
  toolbox: 11,
  "domain-planning": 12,
  covoiturage: 13,
  "photocopies-couleur": 14,
  "chatbot-knowledge": 15,
  assistance: 16,
};

export function getBentoModuleSort(moduleId: string): number {
  return BENTO_MODULE_SORT[moduleId] ?? DEFAULT_SORT;
}

export function sortModuleIds(moduleIds: string[]): string[] {
  return [...moduleIds].sort((a, b) => {
    const sa = getBentoModuleSort(a);
    const sb = getBentoModuleSort(b);
    return sa - sb || a.localeCompare(b);
  });
}

export function defaultBentoModuleOrder(moduleIds: string[]): string[] {
  const set = new Set(moduleIds);
  const main = BENTO_DEFAULT_ORDER.filter((id) => set.has(id));
  const used = new Set(main);
  const rest = sortModuleIds(moduleIds.filter((id) => !used.has(id)));
  return [...main, ...rest];
}

export function defaultBentoModuleColumns(moduleIds: string[]): string[][] {
  return linearOrderToColumns(
    defaultBentoModuleOrder(moduleIds),
    DESKTOP_BENTO_COLUMN_COUNT,
  );
}

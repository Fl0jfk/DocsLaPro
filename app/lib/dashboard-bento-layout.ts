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
  "absences",
  "agent-ia-ocr",
  "prof-room",
  DASHBOARD_ACADEMIC_DEADLINES_MODULE_ID,
  "rh",
  "channels",
  "internat",
  "requests-staff",
  "organigramme",
  "qrcreator",
  "domain-planning",
  "covoiturage",
  "demandes-hse",
];

export const BENTO_MODULE_SORT: Record<string, number> = {
  documents: 1,
  travels: 2,
  absences: 3,
  "agent-ia-ocr": 4,
  "prof-room": 5,
  [DASHBOARD_ACADEMIC_DEADLINES_MODULE_ID]: 6,
  rh: 7,
  channels: 8,
  internat: 9,
  "requests-staff": 10,
  organigramme: 11,
  qrcreator: 12,
  "domain-planning": 13,
  covoiturage: 14,
  "photocopies-couleur": 15,
  "chatbot-knowledge": 16,
  "demandes-hse": 17,
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
  const tailId = "demandes-hse";
  const main = BENTO_DEFAULT_ORDER.filter((id) => set.has(id) && id !== tailId);
  const used = new Set(main);
  const rest = sortModuleIds(moduleIds.filter((id) => !used.has(id) && id !== tailId));
  for (const id of rest) used.add(id);
  const tail = set.has(tailId) ? [tailId] : [];
  return [...main, ...rest, ...tail];
}

export function defaultBentoModuleColumns(moduleIds: string[]): string[][] {
  return linearOrderToColumns(
    defaultBentoModuleOrder(moduleIds),
    DESKTOP_BENTO_COLUMN_COUNT,
  );
}

import { DASHBOARD_WEEK_SHEET_MODULE_ID } from "@/app/lib/dashboard-week-sheet-types";

/** Modules affichés en pied de page admin, pas dans la grille bento. */
export const BENTO_FOOTER_ADMIN_MODULES = new Set(["admin-settings", "admin-members"]);

/** Modules épinglés sous la grille (non déplaçables). */
export const BENTO_PINNED_FOOTER_MODULES = new Set([DASHBOARD_WEEK_SHEET_MODULE_ID]);

export function isBentoFooterAdminModule(moduleId: string): boolean {
  return BENTO_FOOTER_ADMIN_MODULES.has(moduleId);
}

export function isBentoPinnedFooterModule(moduleId: string): boolean {
  return BENTO_PINNED_FOOTER_MODULES.has(moduleId);
}

/** @deprecated Utiliser isBentoPinnedFooterModule */
export function isWeekSheetModule(moduleId: string): boolean {
  return moduleId === DASHBOARD_WEEK_SHEET_MODULE_ID;
}

export function filterBentoGridModuleIds(moduleIds: string[]): string[] {
  const seen = new Set<string>();
  return moduleIds.filter((id) => {
    if (isBentoFooterAdminModule(id) || isBentoPinnedFooterModule(id)) return false;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Modules volontairement compacts (pas besoin de grand espace vertical). */
export const BENTO_COMPACT_MODULES = new Set([
  "toolbox",
  "channels",
  "agent-ia-ocr",
]);

export function isCompactBentoModule(moduleId: string): boolean {
  return BENTO_COMPACT_MODULES.has(moduleId);
}

export function bentoModuleGridClass(_moduleId: string): string {
  return "col-span-1";
}

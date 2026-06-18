"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Categories } from "@/app/contexts/data";
import { isBentoPinnedFooterModule } from "@/app/lib/dashboard-bento-constraints";
import {
  filterHiddenFromColumns,
  flattenBentoColumns,
  placeModuleInColumns,
  shortestColumnIndex,
} from "@/app/lib/dashboard-bento-columns";
import {
  buildDefaultLayout,
  clearSavedBentoLayout,
  loadAndMergeBentoLayout,
  saveSavedBentoLayout,
  type SavedBentoLayout,
} from "@/app/lib/dashboard-bento-persist";

function isGridModule(moduleId: string): boolean {
  return !isBentoPinnedFooterModule(moduleId);
}

export function useBentoDashboardLayout(categories: Categories[], userId: string | undefined) {
  const gridModuleIds = useMemo(
    () => categories.map((c) => c.moduleId).filter(isGridModule),
    [categories],
  );
  const moduleKey = gridModuleIds.join("|");

  const [editMode, setEditMode] = useState(false);
  const [layout, setLayout] = useState<SavedBentoLayout>(() => buildDefaultLayout(gridModuleIds));
  const [pickedModuleId, setPickedModuleId] = useState<string | null>(null);

  useEffect(() => {
    const merged = loadAndMergeBentoLayout(userId, gridModuleIds);
    setLayout(merged);
    saveSavedBentoLayout(userId, merged);
  }, [userId, moduleKey, gridModuleIds]);

  const persist = useCallback(
    (next: SavedBentoLayout) => {
      setLayout(next);
      saveSavedBentoLayout(userId, next);
    },
    [userId],
  );

  const hiddenSet = useMemo(() => new Set(layout.hidden), [layout.hidden]);

  const visibleColumns = useMemo(
    () => filterHiddenFromColumns(layout.columns, hiddenSet),
    [layout.columns, hiddenSet],
  );

  const visibleModuleCount = useMemo(
    () => flattenBentoColumns(visibleColumns).length,
    [visibleColumns],
  );

  const weekSheetCategory = useMemo(
    () => categories.find((c) => isBentoPinnedFooterModule(c.moduleId)) ?? null,
    [categories],
  );

  const hiddenCategories = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.moduleId, c]));
    return layout.hidden
      .filter((id) => isGridModule(id) && byId.has(id))
      .map((id) => byId.get(id)!);
  }, [categories, layout.hidden]);

  const pickModule = useCallback((moduleId: string) => {
    setPickedModuleId((current) => (current === moduleId ? null : moduleId));
  }, []);

  const placePickedModuleInColumn = useCallback(
    (targetCol: number, targetRow: number) => {
      if (!pickedModuleId) return;

      persist({
        ...layout,
        columns: placeModuleInColumns(layout.columns, pickedModuleId, targetCol, targetRow),
      });
      setPickedModuleId(null);
    },
    [layout, persist, pickedModuleId],
  );

  const hideModule = useCallback(
    (moduleId: string) => {
      if (!isGridModule(moduleId) || layout.hidden.includes(moduleId)) return;
      if (pickedModuleId === moduleId) setPickedModuleId(null);
      persist({ ...layout, hidden: [...layout.hidden, moduleId] });
    },
    [layout, persist, pickedModuleId],
  );

  const showModule = useCallback(
    (moduleId: string) => {
      const hidden = layout.hidden.filter((id) => id !== moduleId);
      const inColumns = layout.columns.some((col) => col.includes(moduleId));
      const columns = inColumns
        ? layout.columns
        : layout.columns.map((col, index, all) =>
            index === shortestColumnIndex(all) ? [...col, moduleId] : col,
          );

      persist({ ...layout, hidden, columns });
    },
    [layout, persist],
  );

  const resetLayout = useCallback(() => {
    const defaults = buildDefaultLayout(gridModuleIds);
    clearSavedBentoLayout(userId);
    setLayout(defaults);
    setPickedModuleId(null);
    saveSavedBentoLayout(userId, defaults);
  }, [gridModuleIds, userId]);

  const finishEdit = useCallback(() => {
    saveSavedBentoLayout(userId, layout);
    setEditMode(false);
    setPickedModuleId(null);
  }, [layout, userId]);

  return {
    visibleColumns,
    visibleModuleCount,
    weekSheetCategory,
    hiddenCategories,
    editMode,
    setEditMode,
    pickedModuleId,
    pickModule,
    placePickedModuleInColumn,
    hideModule,
    showModule,
    resetLayout,
    finishEdit,
  };
}

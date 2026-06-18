"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Categories } from "@/app/contexts/data";
import { clampModuleSpan, isWeekSheetModule } from "@/app/lib/dashboard-bento-constraints";
import { resolveGridPlacement } from "@/app/lib/dashboard-bento-grid";
import {
  buildDefaultLayout,
  clearSavedBentoLayout,
  getLayoutPosition,
  getLayoutSpan,
  loadSavedBentoLayout,
  mergeSavedLayout,
  saveSavedBentoLayout,
  type SavedBentoLayout,
} from "@/app/lib/dashboard-bento-persist";

export function useBentoDashboardLayout(categories: Categories[], userId: string | undefined) {
  const moduleIds = useMemo(() => categories.map((c) => c.moduleId), [categories]);
  const moduleKey = moduleIds.join("|");

  const [editMode, setEditMode] = useState(false);
  const [layout, setLayout] = useState<SavedBentoLayout>(() => buildDefaultLayout(moduleIds));
  const [dragPreview, setDragPreview] = useState<{
    moduleId: string;
    col: number;
    row: number;
  } | null>(null);

  useEffect(() => {
    const saved = loadSavedBentoLayout(userId);
    setLayout(mergeSavedLayout(moduleIds, saved));
  }, [userId, moduleKey, moduleIds]);

  const persist = useCallback(
    (next: SavedBentoLayout) => {
      setLayout(next);
      saveSavedBentoLayout(userId, next);
    },
    [userId],
  );

  const hiddenSet = useMemo(() => new Set(layout.hidden), [layout.hidden]);

  const visibleCategories = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.moduleId, c]));
    return layout.order
      .filter((id) => byId.has(id) && !hiddenSet.has(id))
      .map((id) => byId.get(id)!)
      .sort((a, b) => {
        const pa = layout.positions[a.moduleId] ?? { col: 1, row: 1 };
        const pb = layout.positions[b.moduleId] ?? { col: 1, row: 1 };
        return pa.row - pb.row || pa.col - pb.col;
      });
  }, [categories, layout.order, layout.positions, hiddenSet]);

  const hiddenCategories = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.moduleId, c]));
    return layout.hidden.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
  }, [categories, layout.hidden]);

  const getSpan = useCallback((moduleId: string) => getLayoutSpan(layout, moduleId), [layout]);
  const getPosition = useCallback(
    (moduleId: string) => getLayoutPosition(layout, moduleId),
    [layout],
  );

  const placeModuleAt = useCallback(
    (moduleId: string, col: number, row: number) => {
      const preferredCol = isWeekSheetModule(moduleId) ? 1 : col;
      const resolved = resolveGridPlacement(layout.positions, layout.spans, moduleId, preferredCol, row);
      const nextSpans = {
        ...layout.spans,
        [moduleId]: isWeekSheetModule(moduleId)
          ? clampModuleSpan(moduleId, resolved.colSpan, resolved.rowSpan)
          : { colSpan: resolved.colSpan, rowSpan: resolved.rowSpan },
      };
      persist({
        ...layout,
        positions: {
          ...layout.positions,
          [moduleId]: {
            col: isWeekSheetModule(moduleId) ? 1 : resolved.col,
            row: resolved.row,
          },
        },
        spans: nextSpans,
      });
    },
    [layout, persist],
  );

  const setModuleSpan = useCallback(
    (moduleId: string, colSpan: number, rowSpan: number) => {
      const clamped = clampModuleSpan(moduleId, colSpan, rowSpan);
      const pos = getLayoutPosition(layout, moduleId);
      const resolved = resolveGridPlacement(
        layout.positions,
        { ...layout.spans, [moduleId]: clamped },
        moduleId,
        pos.col,
        pos.row,
      );
      persist({
        ...layout,
        positions: {
          ...layout.positions,
          [moduleId]: { col: resolved.col, row: resolved.row },
        },
        spans: {
          ...layout.spans,
          [moduleId]: { colSpan: resolved.colSpan, rowSpan: resolved.rowSpan },
        },
      });
    },
    [layout, persist],
  );

  const hideModule = useCallback(
    (moduleId: string) => {
      if (layout.hidden.includes(moduleId)) return;
      const nextPositions = { ...layout.positions };
      delete nextPositions[moduleId];
      persist({ ...layout, hidden: [...layout.hidden, moduleId], positions: nextPositions });
    },
    [layout, persist],
  );

  const showModule = useCallback(
    (moduleId: string) => {
      const hidden = layout.hidden.filter((id) => id !== moduleId);
      const hiddenSetNext = new Set(hidden);
      const visibleOrder = layout.order.filter((id) => !hiddenSetNext.has(id));
      const resolved = resolveGridPlacement(
        layout.positions,
        layout.spans,
        moduleId,
        layout.positions[moduleId]?.col ?? 1,
        layout.positions[moduleId]?.row ?? 1,
      );
      persist({
        ...layout,
        hidden,
        positions: {
          ...layout.positions,
          [moduleId]: { col: resolved.col, row: resolved.row },
        },
        spans: {
          ...layout.spans,
          [moduleId]: { colSpan: resolved.colSpan, rowSpan: resolved.rowSpan },
        },
        order: visibleOrder.includes(moduleId)
          ? layout.order
          : [...layout.order, moduleId],
      });
    },
    [layout, persist],
  );

  const resetLayout = useCallback(() => {
    const defaults = buildDefaultLayout(moduleIds);
    clearSavedBentoLayout(userId);
    setLayout(defaults);
  }, [moduleIds, userId]);

  const finishEdit = useCallback(() => {
    saveSavedBentoLayout(userId, layout);
    setEditMode(false);
    setDragPreview(null);
  }, [layout, userId]);

  const previewPlacement = useCallback((moduleId: string, col: number, row: number) => {
    setDragPreview({ moduleId, col, row });
  }, []);

  const clearPreview = useCallback(() => {
    setDragPreview(null);
  }, []);

  return {
    visibleCategories,
    hiddenCategories,
    getSpan,
    getPosition,
    editMode,
    setEditMode,
    dragPreview,
    previewPlacement,
    clearPreview,
    placeModuleAt,
    setModuleSpan,
    hideModule,
    showModule,
    resetLayout,
    finishEdit,
  };
}

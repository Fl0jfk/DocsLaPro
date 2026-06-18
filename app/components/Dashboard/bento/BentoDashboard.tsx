"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Categories } from "@/app/contexts/data";
import BentoEditOverlay from "@/app/components/Dashboard/bento/BentoEditOverlay";
import { useBentoDashboardLayout } from "@/app/hooks/useBentoDashboardLayout";
import { colSpanClass, rowSpanClass } from "@/app/lib/dashboard-bento-layout";
import {
  clampColStart,
  gridPlacementStylePlain,
  maxOccupiedRow,
  pointerToGridCell,
} from "@/app/lib/dashboard-bento-grid";
import { getBentoWidgetSize } from "@/app/lib/bento-widget-size";
import { DASHBOARD_WEEK_SHEET_MODULE_ID } from "@/app/lib/dashboard-week-sheet-types";
import { renderBentoWidget } from "./BentoWidgets";
import { dash } from "@/app/lib/dashboard-brand";

type Props = {
  categories: Categories[];
  userId?: string;
  onEnterEdit?: () => void;
  onFinishEdit?: () => void;
  quickLinksEditor?: ReactNode;
};

const GRID_GAP_PX = 16;
const ROW_UNIT_REM = 7;
const GRID_PADDING_EDIT = 12;

const itemMotion = {
  hidden: { opacity: 0, scale: 0.97, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function measureGridUnits(el: HTMLElement | null) {
  if (!el || typeof window === "undefined") {
    return { colUnit: 96, rowUnit: 128 };
  }
  const style = window.getComputedStyle(el);
  const gap = Number.parseFloat(style.columnGap || style.gap || "16") || GRID_GAP_PX;
  const colUnit = (el.clientWidth - gap * 11) / 12;
  const rowUnit =
    ROW_UNIT_REM * Number.parseFloat(style.fontSize || "16") + gap;
  return { colUnit: Math.max(colUnit, 48), rowUnit: Math.max(rowUnit, 80) };
}

export default function BentoDashboard({
  categories,
  userId,
  onEnterEdit,
  onFinishEdit,
  quickLinksEditor,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridUnits, setGridUnits] = useState({ colUnit: 96, rowUnit: 128 });
  const [isWide, setIsWide] = useState(true);

  const {
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
  } = useBentoDashboardLayout(categories, userId);

  const enterEdit = useCallback(() => {
    onEnterEdit?.();
    setEditMode(true);
  }, [onEnterEdit, setEditMode]);

  const handleFinish = useCallback(() => {
    onFinishEdit?.();
    finishEdit();
  }, [finishEdit, onFinishEdit]);

  const refreshGridUnits = useCallback(() => {
    setGridUnits(measureGridUnits(gridRef.current));
  }, []);

  useEffect(() => {
    refreshGridUnits();
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(refreshGridUnits);
    ro.observe(el);
    window.addEventListener("resize", refreshGridUnits);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", refreshGridUnits);
    };
  }, [editMode, refreshGridUnits, visibleCategories.length]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsWide(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const cellFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const grid = gridRef.current;
      if (!grid) return { col: 1, row: 1 };
      const rect = grid.getBoundingClientRect();
      const padding = editMode ? GRID_PADDING_EDIT : 0;
      return pointerToGridCell(
        rect,
        clientX,
        clientY,
        gridUnits.colUnit,
        gridUnits.rowUnit,
        GRID_GAP_PX,
        padding,
      );
    },
    [editMode, gridUnits.colUnit, gridUnits.rowUnit],
  );

  const startGridDrag = useCallback(
    (moduleId: string, e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const handle = e.currentTarget;
      handle.setPointerCapture(e.pointerId);

      const span = getSpan(moduleId);

      const onMove = (ev: PointerEvent) => {
        const cell = cellFromClient(ev.clientX, ev.clientY);
        previewPlacement(moduleId, clampColStart(cell.col, span.colSpan), cell.row);
      };

      const onUp = (ev: PointerEvent) => {
        handle.releasePointerCapture(e.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        const cell = cellFromClient(ev.clientX, ev.clientY);
        placeModuleAt(moduleId, clampColStart(cell.col, span.colSpan), cell.row);
        clearPreview();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      const cell = cellFromClient(e.clientX, e.clientY);
      previewPlacement(moduleId, clampColStart(cell.col, span.colSpan), cell.row);
    },
    [cellFromClient, clearPreview, getSpan, placeModuleAt, previewPlacement],
  );

  const visibleIds = visibleCategories.map((c) => c.moduleId);
  const gridRows = maxOccupiedRow(
    Object.fromEntries(
      visibleCategories.map((c) => {
        const id = c.moduleId;
        const preview =
          dragPreview?.moduleId === id ? dragPreview : getPosition(id);
        return [id, preview];
      }),
    ),
    Object.fromEntries(visibleCategories.map((c) => [c.moduleId, getSpan(c.moduleId)])),
    visibleIds,
  );

  return (
    <div className="space-y-4">
      <div
        ref={gridRef}
        className={`grid grid-cols-1 gap-4 lg:grid-cols-12 lg:auto-rows-[minmax(7rem,auto)] ${
          editMode ? `rounded-2xl border-2 border-dashed p-3 ${dash.editZone}` : ""
        }`}
        style={
          isWide
            ? { gridTemplateRows: `repeat(${gridRows}, minmax(7rem, auto))` }
            : undefined
        }
      >
        {visibleCategories.map((category, index) => {
          const span = getSpan(category.moduleId);
          const size = getBentoWidgetSize(span);
          const savedPos = getPosition(category.moduleId);
          const pos =
            dragPreview?.moduleId === category.moduleId ? dragPreview : savedPos;
          const isDragging = dragPreview?.moduleId === category.moduleId;

          const isWeekSheet = category.moduleId === DASHBOARD_WEEK_SHEET_MODULE_ID;
          const placementStyle = isWide ? gridPlacementStylePlain(pos, span) : undefined;
          const flowClass = isWide
            ? isWeekSheet
              ? "min-h-[8.5rem] h-auto overflow-visible"
              : "min-h-[8.5rem]"
            : `col-span-1 min-h-[8.5rem] ${colSpanClass(span.colSpan)} ${rowSpanClass(span.rowSpan)}`;

          const shellClass = `${flowClass} ${
            editMode ? `relative rounded-2xl ring-2 ring-offset-1 ${dash.ringBright35}` : ""
          } ${isDragging ? `z-20 ring-offset-2 ${dash.ringBright}` : ""}`;

          const content = (
            <div className={`relative ${isWeekSheet ? "h-auto min-h-[8.5rem]" : "h-full min-h-[8.5rem]"}`}>
              <div
                className={
                  editMode
                    ? `pointer-events-none opacity-70 ${isWeekSheet ? "" : "h-full"}`
                    : isWeekSheet
                      ? ""
                      : "h-full"
                }
              >
                {renderBentoWidget(category, size)}
              </div>
              {editMode ? (
                <BentoEditOverlay
                  moduleId={category.moduleId}
                  moduleName={category.name}
                  colSpan={span.colSpan}
                  rowSpan={span.rowSpan}
                  colUnitPx={gridUnits.colUnit}
                  rowUnitPx={gridUnits.rowUnit}
                  onMovePointerDown={startGridDrag}
                  onResize={setModuleSpan}
                  onHide={hideModule}
                />
              ) : null}
            </div>
          );

          if (editMode) {
            return (
              <div key={category.moduleId} className={shellClass} style={placementStyle}>
                {content}
              </div>
            );
          }

          return (
            <motion.div
              key={category.moduleId}
              custom={index}
              variants={itemMotion}
              initial="hidden"
              animate="show"
              className={shellClass}
              style={placementStyle}
            >
              {content}
            </motion.div>
          );
        })}
      </div>

      {!editMode && visibleCategories.length === 0 ? (
        <p className={`rounded-xl border border-dashed px-4 py-8 text-center text-sm text-stone-500 ${dash.editZone}`}>
          Tous les modules sont masqués.{" "}
          <button
            type="button"
            onClick={enterEdit}
            className={`font-bold hover:underline ${dash.textPrimary}`}
          >
            Personnaliser
          </button>{" "}
          pour en réafficher.
        </p>
      ) : null}

      {editMode ? (
        <div className={`space-y-3 rounded-xl border bg-white/80 px-4 py-3 ${dash.borderSoft}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-stone-500">
              Glissez sur la grille (12 colonnes) · redimensionner · masquer · accès rapides
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetLayout}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-stone-500 hover:bg-stone-50 hover:text-stone-700"
              >
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white hover:brightness-110 ${dash.btnPrimary}`}
              >
                Terminer
              </button>
            </div>
          </div>
          {hiddenCategories.length > 0 ? (
            <div className={`border-t pt-3 ${dash.border}`}>
              <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-stone-400">
                Modules masqués
              </p>
              <div className="flex flex-wrap gap-2">
                {hiddenCategories.map((category) => (
                  <button
                    key={category.moduleId}
                    type="button"
                    onClick={() => showModule(category.moduleId)}
                    className={`rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-semibold text-stone-600 transition ${dash.hoverBorder} ${dash.hoverBgSoft} ${dash.hoverPrimary}`}
                  >
                    + {category.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {quickLinksEditor}
        </div>
      ) : (
        <div className="flex justify-center pt-2 sm:justify-end">
          <button
            type="button"
            onClick={enterEdit}
            className={`text-[11px] font-semibold text-stone-400 transition ${dash.hoverPrimary}`}
          >
            Personnaliser le tableau de bord
          </button>
        </div>
      )}
    </div>
  );
}

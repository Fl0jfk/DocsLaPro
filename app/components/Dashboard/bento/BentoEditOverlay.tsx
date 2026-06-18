"use client";

import { useCallback, useRef } from "react";
import {
  canResizeCol,
  canResizeRow,
  resizeColByDrag,
  resizeRowByDrag,
} from "@/app/lib/dashboard-bento-constraints";

type Props = {
  moduleId: string;
  moduleName: string;
  colSpan: number;
  rowSpan: number;
  colUnitPx: number;
  rowUnitPx: number;
  onMovePointerDown: (moduleId: string, e: React.PointerEvent<HTMLButtonElement>) => void;
  onResize: (moduleId: string, colSpan: number, rowSpan: number) => void;
  onHide: (moduleId: string) => void;
};

export default function BentoEditOverlay({
  moduleId,
  moduleName,
  colSpan,
  rowSpan,
  colUnitPx,
  rowUnitPx,
  onMovePointerDown,
  onResize,
  onHide,
}: Props) {
  const resizeRef = useRef<{ col: number; row: number } | null>(null);

  const startColResize = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startCol = colSpan;
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const next = resizeColByDrag(moduleId, startCol, ev.clientX - startX, colUnitPx);
        if (resizeRef.current?.col !== next) {
          resizeRef.current = { col: next, row: rowSpan };
          onResize(moduleId, next, rowSpan);
        }
      };
      const onUp = () => {
        el.releasePointerCapture(e.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        resizeRef.current = null;
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [colSpan, colUnitPx, moduleId, onResize, rowSpan],
  );

  const startRowResize = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const startY = e.clientY;
      const startRow = rowSpan;
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const next = resizeRowByDrag(moduleId, startRow, ev.clientY - startY, rowUnitPx);
        if (resizeRef.current?.row !== next) {
          resizeRef.current = { col: colSpan, row: next };
          onResize(moduleId, colSpan, next);
        }
      };
      const onUp = () => {
        el.releasePointerCapture(e.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        resizeRef.current = null;
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [colSpan, moduleId, onResize, rowSpan, rowUnitPx],
  );

  const showCol = canResizeCol(moduleId);
  const showRow = canResizeRow(moduleId);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div className="absolute inset-0 bg-white/40" aria-hidden />

      <button
        type="button"
        onClick={() => onHide(moduleId)}
        className="pointer-events-auto absolute right-2 top-2 z-50 rounded-lg border border-stone-200 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-stone-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        title={`Masquer ${moduleName}`}
      >
        Masquer
      </button>

      <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center p-4">
        <button
          type="button"
          onPointerDown={(e) => onMovePointerDown(moduleId, e)}
          className="flex min-h-[5.5rem] min-w-[5.5rem] cursor-grab flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[color:var(--dash-primary)] bg-[color:var(--dash-soft-muted)]/95 px-6 py-5 shadow-lg shadow-emerald-900/10 transition hover:scale-[1.02] hover:bg-white active:cursor-grabbing active:scale-[0.98] sm:min-h-[6.5rem] sm:min-w-[7rem] touch-none"
          aria-label={`Déplacer ${moduleName}`}
          title="Glisser sur la grille"
        >
          <span className="select-none text-5xl leading-none tracking-widest text-[var(--dash-primary)] sm:text-6xl">
            ⠿
          </span>
          <span className="mt-2 text-center text-[11px] font-black uppercase tracking-wide text-[var(--dash-primary)]">
            Déplacer
          </span>
          <span className="mt-0.5 max-w-[8rem] truncate text-center text-[10px] font-bold text-stone-500">
            {moduleName}
          </span>
        </button>
        <p className="mt-3 text-center text-[10px] font-bold text-stone-400">
          {colSpan}×{rowSpan} · grille 12 colonnes
        </p>
      </div>

      {showCol ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionner la largeur"
          onPointerDown={startColResize}
          className="pointer-events-auto absolute bottom-4 right-0 top-4 z-40 w-4 cursor-ew-resize rounded-l-lg bg-[var(--dash-primary)]/15 hover:bg-[var(--dash-primary)]/30"
        >
          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 flex-col gap-1">
            <span className="h-1 w-1 rounded-full bg-[var(--dash-primary)]" />
            <span className="h-1 w-1 rounded-full bg-[var(--dash-primary)]" />
            <span className="h-1 w-1 rounded-full bg-[var(--dash-primary)]" />
          </div>
        </div>
      ) : null}

      {showRow ? (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Redimensionner la hauteur"
          onPointerDown={startRowResize}
          className="pointer-events-auto absolute bottom-0 left-4 right-4 z-40 h-4 cursor-ns-resize rounded-t-lg bg-[var(--dash-primary)]/15 hover:bg-[var(--dash-primary)]/30"
        >
          <div className="absolute left-1/2 top-1 flex -translate-x-1/2 gap-1">
            <span className="h-1 w-1 rounded-full bg-[var(--dash-primary)]" />
            <span className="h-1 w-1 rounded-full bg-[var(--dash-primary)]" />
            <span className="h-1 w-1 rounded-full bg-[var(--dash-primary)]" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

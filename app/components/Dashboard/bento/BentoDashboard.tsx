"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Categories } from "@/app/contexts/data";
import BentoColumnGrid from "@/app/components/Dashboard/bento/BentoColumnGrid";
import BentoEditColumnGrid from "@/app/components/Dashboard/bento/BentoEditColumnGrid";
import LazyBentoWidget from "@/app/components/Dashboard/bento/LazyBentoWidget";
import { useBentoDashboardLayout } from "@/app/hooks/useBentoDashboardLayout";
import { columnsForViewport } from "@/app/lib/dashboard-bento-columns";
import {
  getBentoWidgetSize,
  getDashboardViewport,
  type DashboardViewport,
} from "@/app/lib/bento-widget-size";
import { renderBentoWidget } from "./BentoWidgets";
import { dash } from "@/app/lib/dashboard-brand";

type Props = {
  categories: Categories[];
  userId?: string;
  onEnterEdit?: () => void;
  onFinishEdit?: () => void;
  quickLinksEditor?: ReactNode;
};

function useDashboardViewport(): DashboardViewport {
  const [viewport, setViewport] = useState<DashboardViewport>("desktop");

  useEffect(() => {
    const apply = () => setViewport(getDashboardViewport(window.innerWidth));
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return viewport;
}

export default function BentoDashboard({
  categories,
  userId,
  onEnterEdit,
  onFinishEdit,
  quickLinksEditor,
}: Props) {
  const viewport = useDashboardViewport();
  const widgetSize = getBentoWidgetSize(viewport);

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.moduleId, c])),
    [categories],
  );

  const {
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
  } = useBentoDashboardLayout(categories, userId);

  const enterEdit = useCallback(() => {
    onEnterEdit?.();
    setEditMode(true);
  }, [onEnterEdit, setEditMode]);

  const handleFinish = useCallback(() => {
    onFinishEdit?.();
    finishEdit();
  }, [finishEdit, onFinishEdit]);

  const gridColumns = useMemo(() => {
    const cols = editMode
      ? visibleColumns
      : columnsForViewport(visibleColumns, viewport);

    return cols.map((col) =>
      col
        .map((moduleId) => categoriesById.get(moduleId))
        .filter(Boolean)
        .map((category) => ({
          id: category!.moduleId,
          node: (
            <LazyBentoWidget key={category!.moduleId}>
              {renderBentoWidget(category!, widgetSize)}
            </LazyBentoWidget>
          ),
        })),
    );
  }, [categoriesById, editMode, visibleColumns, viewport, widgetSize]);

  return (
    <div className="space-y-4">
      <div className={editMode ? `rounded-2xl border-2 border-dashed p-3 ${dash.editZone}` : ""}>
        {editMode ? (
          <BentoEditColumnGrid
            visibleColumns={visibleColumns}
            categoriesById={categoriesById}
            pickedModuleId={pickedModuleId}
            onPick={pickModule}
            onPlaceInColumn={placePickedModuleInColumn}
            onHide={hideModule}
          />
        ) : (
          <BentoColumnGrid columns={gridColumns} />
        )}
      </div>

      {weekSheetCategory ? (
        <div className={`min-w-0 ${editMode ? "opacity-70" : ""}`}>
          {editMode ? (
            <p className="mb-2 text-center text-[10px] font-semibold text-stone-400">
              Feuille de semaine — toujours affichée ici, hors grille
            </p>
          ) : null}
          <LazyBentoWidget>
            {renderBentoWidget(weekSheetCategory, widgetSize)}
          </LazyBentoWidget>
        </div>
      ) : null}

      {!editMode && visibleModuleCount === 0 ? (
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
              Chaque colonne se gère séparément · feuille de semaine fixée en bas
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

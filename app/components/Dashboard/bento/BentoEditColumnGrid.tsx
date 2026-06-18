"use client";

import type { Categories } from "@/app/contexts/data";
import { DESKTOP_BENTO_COLUMN_COUNT } from "@/app/lib/dashboard-bento-columns";
import { dash } from "@/app/lib/dashboard-brand";

type Props = {
  visibleColumns: string[][];
  categoriesById: Map<string, Categories>;
  pickedModuleId: string | null;
  onPick: (moduleId: string) => void;
  onPlaceInColumn: (targetCol: number, targetRow: number) => void;
  onHide: (moduleId: string) => void;
};

function ColumnInsertGap({
  label,
  enabled,
  onClick,
  compact,
}: {
  label: string;
  enabled: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className={`w-full rounded-lg border-2 border-dashed transition-all duration-150 ${
        compact ? "px-2 py-1.5" : "px-2 py-2"
      } ${
        enabled
          ? "cursor-pointer border-[var(--dash-primary)]/50 bg-[color:var(--dash-soft-muted)]/50 hover:border-[var(--dash-primary)] hover:bg-[color:var(--dash-soft-muted)]"
          : "cursor-default border-stone-200/70 bg-stone-50/40 opacity-50"
      }`}
    >
      <span
        className={`block text-center font-bold ${
          compact ? "text-[9px]" : "text-[10px]"
        } ${enabled ? "text-[var(--dash-primary)]" : "text-stone-400"}`}
      >
        {enabled ? label : "—"}
      </span>
    </button>
  );
}

function EditModuleCard({
  category,
  isPicked,
  picking,
  onPick,
  onHide,
  positionLabel,
}: {
  category: Categories;
  isPicked: boolean;
  picking: boolean;
  onPick: (moduleId: string) => void;
  onHide: (moduleId: string) => void;
  positionLabel: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-white shadow-sm transition ${
        isPicked
          ? `ring-2 ring-offset-1 ${dash.ringBright} border-[var(--dash-primary)]`
          : dash.border
      } ${picking && !isPicked ? "opacity-70" : ""}`}
    >
      <div className="px-2.5 py-2">
        <p className={`truncate text-xs font-black leading-tight ${dash.ink}`}>{category.name}</p>
        <p className="mt-0.5 text-[9px] font-semibold text-stone-400">{positionLabel}</p>
      </div>
      <div className={`flex border-t ${dash.border}`}>
        <button
          type="button"
          onClick={() => onPick(category.moduleId)}
          className={`flex-1 px-2 py-1.5 text-[10px] font-bold transition ${
            isPicked
              ? "bg-stone-100 text-stone-600 hover:bg-stone-200"
              : `${dash.btnPrimary} text-white hover:brightness-110`
          }`}
        >
          {isPicked ? "Annuler" : "Déplacer"}
        </button>
        <button
          type="button"
          onClick={() => onHide(category.moduleId)}
          className="flex-1 border-l border-stone-200 px-2 py-1.5 text-[10px] font-bold text-stone-500 transition hover:bg-red-50 hover:text-red-600"
        >
          Masquer
        </button>
      </div>
    </div>
  );
}

export default function BentoEditColumnGrid({
  visibleColumns,
  categoriesById,
  pickedModuleId,
  onPick,
  onPlaceInColumn,
  onHide,
}: Props) {
  const picking = pickedModuleId !== null;
  const pickedName = pickedModuleId
    ? categoriesById.get(pickedModuleId)?.name
    : undefined;

  const displayColumns = visibleColumns.map((col) =>
    pickedModuleId ? col.filter((id) => id !== pickedModuleId) : col,
  );

  return (
    <div className="space-y-3">
      {picking ? (
        <p
          className={`rounded-lg border px-3 py-2 text-center text-xs font-bold ${dash.border} ${dash.textPrimary} bg-[color:var(--dash-soft-muted)]/60`}
        >
          « {pickedName} » sélectionné — chaque colonne est indépendante
        </p>
      ) : (
        <p className="text-center text-xs text-stone-500">
          3 colonnes indépendantes · <span className="font-bold">Déplacer</span> puis{" "}
          <span className="font-bold">Insérer</span> — les autres colonnes ne bougent pas
        </p>
      )}

      <div
        className="grid items-start gap-3"
        style={{
          gridTemplateColumns: `repeat(${DESKTOP_BENTO_COLUMN_COUNT}, minmax(0, 1fr))`,
        }}
      >
        {displayColumns.map((colItems, colIndex) => (
          <div key={colIndex} className="flex min-w-0 flex-col gap-2">
            <p className="text-center text-[9px] font-black uppercase tracking-wide text-stone-400">
              Colonne {colIndex + 1}
            </p>

            <ColumnInsertGap
              label="↑ Insérer en haut"
              enabled={picking}
              compact
              onClick={() => onPlaceInColumn(colIndex, 0)}
            />

            {colItems.map((moduleId, rowIndex) => {
              const category = categoriesById.get(moduleId);
              if (!category) return null;
              const isPicked = pickedModuleId === moduleId;

              return (
                <div key={moduleId} className="space-y-2">
                  <EditModuleCard
                    category={category}
                    isPicked={isPicked}
                    picking={picking}
                    onPick={onPick}
                    onHide={onHide}
                    positionLabel={`Rang ${rowIndex + 1}`}
                  />
                  <ColumnInsertGap
                    label="↓ Insérer ici"
                    enabled={picking}
                    compact
                    onClick={() => onPlaceInColumn(colIndex, rowIndex + 1)}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

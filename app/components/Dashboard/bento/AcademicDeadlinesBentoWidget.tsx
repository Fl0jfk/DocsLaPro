"use client";

import { useCallback, useEffect, useState } from "react";
import type { Categories } from "@/app/contexts/data";
import BentoStaticWidget from "@/app/components/Dashboard/bento/BentoStaticWidget";
import AcademicDeadlineImportModal from "@/app/components/Dashboard/bento/AcademicDeadlineImportModal";
import type { AcademicDeadlineView, AcademicDeadlinesPayload } from "@/app/lib/academic-deadlines";
import type { BentoWidgetSize } from "@/app/lib/bento-widget-size";
import { useCanEditAcademicDeadlines } from "@/app/hooks/useCanEditAcademicDeadlines";
import { dash } from "@/app/lib/dashboard-brand";

type Props = { category: Categories; size: BentoWidgetSize };

/** Hauteur max. ≈ 6 lignes compactes + espacements (le reste défile). */
const ACADEMIC_LIST_MAX_HEIGHT = "max-h-[calc(6*2.625rem+5*0.25rem)]";

function CompactRow({ item }: { item: AcademicDeadlineView }) {
  const isWindow = item.isOngoing;
  return (
    <li
      className={`flex items-start gap-2 rounded-lg border px-2 py-1.5 ${
        isWindow
          ? "border-stone-200/80 bg-stone-50/80"
          : "border-[color:var(--dash-border)] bg-white"
      }`}
    >
      <span className="shrink-0 text-sm leading-none" aria-hidden>
        {item.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[11px] font-bold ${dash.ink}`}>{item.title}</p>
        <p className="truncate text-[10px] text-stone-500">
          {isWindow ? "Période · " : ""}
          {item.dateLabel}
          {item.platform ? ` · ${item.platform}` : ""}
        </p>
      </div>
      {item.sourceUrl ? (
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 text-[10px] font-bold ${dash.textMid} hover:underline`}
          title="Source"
        >
          ↗
        </a>
      ) : null}
    </li>
  );
}

export function AcademicDeadlinesBentoWidget({ category }: Props) {
  const canEdit = useCanEditAcademicDeadlines();
  const [data, setData] = useState<AcademicDeadlinesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/academic-deadlines", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && !json.error) setData(json as AcademicDeadlinesPayload);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const displayItems = data?.displayItems ?? data?.topItems ?? [];
  const scopeLabel = data?.headline?.scopeLabel;
  const total = displayItems.length;

  const headerExtra = canEdit ? (
    <button
      type="button"
      onClick={() => {
        setError(null);
        setImportOpen(true);
      }}
      className="rounded-lg border border-[color:var(--dash-border)] bg-white px-2 py-1 text-[10px] font-bold text-[var(--dash-primary)] hover:bg-[color:var(--dash-soft-muted)]"
    >
      Charger
    </button>
  ) : null;

  return (
    <>
      <BentoStaticWidget
        title={category.name}
        iconSrc={category.img}
        subtitle={
          total > 0
            ? `${scopeLabel ?? "Calendrier"} · ${total} échéance${total > 1 ? "s" : ""}`
            : "Académie de Normandie"
        }
        headerExtra={headerExtra}
        bodyClassName="overflow-hidden p-2 sm:p-2.5"
      >
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <p className="text-[11px] text-stone-400">Chargement…</p>
          </div>
        ) : displayItems.length === 0 ? (
          <p className="py-3 text-center text-[11px] text-stone-500">
            {canEdit
              ? "Collez un texte, un PDF ou ajoutez une échéance via « Charger »."
              : "Aucune échéance proche."}
          </p>
        ) : (
          <ul
            className={`${ACADEMIC_LIST_MAX_HEIGHT} space-y-1 overflow-y-auto overscroll-contain scroll-pb-1 pb-1 [scrollbar-gutter:stable]`}
          >
            {displayItems.map((item) => (
              <CompactRow key={item.id} item={item} />
            ))}
          </ul>
        )}
        {error ? <p className="mt-2 text-center text-[10px] font-semibold text-red-600">{error}</p> : null}
      </BentoStaticWidget>

      {canEdit ? (
        <AcademicDeadlineImportModal
          open={importOpen}
          onDone={(payload) => {
            setData(payload);
            setError(null);
          }}
          onError={setError}
          onClose={() => setImportOpen(false)}
        />
      ) : null}
    </>
  );
}

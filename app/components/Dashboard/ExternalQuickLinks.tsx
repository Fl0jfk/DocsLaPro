"use client";

import type { DashboardQuickLink } from "@/app/lib/dashboard-quick-links";
import { MAX_DASHBOARD_QUICK_LINKS } from "@/app/lib/dashboard-quick-links";
import { dash } from "@/app/lib/dashboard-brand";

export function QuickLinkIcon({ src, name }: { src: string; name: string }) {
  if (!src) {
    return (
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${dash.bgSoftMuted} ${dash.textMid}`}>
        {name.slice(0, 1).toUpperCase() || "?"}
      </div>
    );
  }
  return (
    <div className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-lg ${dash.bgSoftMuted}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-contain p-0.5" />
    </div>
  );
}

export function ExternalQuickLinksBar({ links }: { links: DashboardQuickLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
      <span className={`w-full text-[10px] font-bold uppercase tracking-widest sm:mr-1 sm:w-auto ${dash.label}`}>
        Accès rapides
      </span>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.link}
          target="_blank"
          rel="noopener noreferrer"
          title={link.name}
          className={`group flex items-center gap-2 rounded-xl border bg-white/90 px-2.5 py-1.5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${dash.borderSoft} ${dash.hoverBorder}`}
        >
          <QuickLinkIcon src={link.img} name={link.name} />
          <span className={`max-w-[8rem] truncate text-xs font-bold text-stone-600 sm:max-w-[10rem] ${dash.hoverPrimary}`}>
            {link.name}
          </span>
        </a>
      ))}
    </div>
  );
}

type EditorProps = {
  draft: DashboardQuickLink[];
  onUpdate: (index: number, patch: Partial<DashboardQuickLink>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onClearAll: () => void;
};

export function ExternalQuickLinksEditor({
  draft,
  onUpdate,
  onAdd,
  onRemove,
  onClearAll,
}: EditorProps) {
  return (
    <div className={`border-t pt-3 ${dash.border}`}>
      <p className="text-[10px] font-black uppercase tracking-wide text-stone-400">
        Accès rapides (max {MAX_DASHBOARD_QUICK_LINKS})
      </p>
      <p className="mt-1 text-[11px] text-stone-500">
        Nom, lien et URL de l&apos;image. Enregistré avec « Terminer ».
      </p>
      <div className="mt-3 space-y-3">
        {draft.length === 0 ? (
          <p className="text-xs text-stone-400">Aucun raccourci — ajoutez-en ou laissez vide.</p>
        ) : (
          draft.map((row, index) => (
            <div key={row.id} className={`rounded-xl border p-3 ${dash.border} ${dash.bgSoft25}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase text-stone-400">Lien {index + 1}</span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700"
                >
                  Retirer
                </button>
              </div>
              <div className="flex gap-2">
                <QuickLinkIcon src={row.img} name={row.name} />
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => onUpdate(index, { name: e.target.value })}
                    placeholder="Nom (ex. École Directe)"
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${dash.border} ${dash.focusBorder} ${dash.focusRing}`}
                  />
                  <input
                    type="url"
                    value={row.link}
                    onChange={(e) => onUpdate(index, { link: e.target.value })}
                    placeholder="https://…"
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${dash.border} ${dash.focusBorder} ${dash.focusRing}`}
                  />
                  <input
                    type="url"
                    value={row.img}
                    onChange={(e) => onUpdate(index, { img: e.target.value })}
                    placeholder="URL de l'image (https://…)"
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${dash.border} ${dash.focusBorder} ${dash.focusRing}`}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {draft.length < MAX_DASHBOARD_QUICK_LINKS ? (
          <button
            type="button"
            onClick={onAdd}
            className={`text-[11px] font-bold hover:underline ${dash.textPrimary}`}
          >
            + Ajouter un lien
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] font-bold text-stone-500 hover:text-red-600"
        >
          Tout effacer
        </button>
      </div>
    </div>
  );
}

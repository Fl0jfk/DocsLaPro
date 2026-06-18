"use client";

import type { PileKey } from "@/app/components/requests/CorbeilleInbox";
import {
  buildBoardMoveOptions,
  getRequestBoardLocation,
  type VisualColumnKey,
} from "@/app/lib/request-board-move";

export default function RequestBoardMoveSelect({
  requestId,
  item,
  serviceLabel,
  disabled,
  onMoveToPile,
  onMoveToColumn,
}: {
  requestId: string;
  item: { boardColumn?: string | null };
  serviceLabel: string;
  disabled?: boolean;
  onMoveToPile: (pile: PileKey, requestId: string) => void;
  onMoveToColumn: (column: VisualColumnKey, requestId: string) => void;
}) {
  const options = buildBoardMoveOptions(serviceLabel, getRequestBoardLocation(item));

  const handleMove = (option: (typeof options)[number]) => {
    if (option.target.kind === "pile") onMoveToPile(option.target.key, requestId);
    else onMoveToColumn(option.target.key, requestId);
  };

  return (
    <div
      className="md:hidden mt-2 pt-2 border-t border-slate-200/60"
      data-no-drag
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Déplacer vers</p>
      <ul className="mt-1 space-y-1" role="listbox" aria-label="Déplacer la demande">
        {options.map((o) => (
          <li key={o.key}>
            <button
              type="button"
              role="option"
              disabled={disabled}
              onClick={() => handleMove(o)}
              className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left text-[11px] font-semibold text-slate-800 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              <span className="min-w-0 truncate leading-snug">{o.label}</span>
              <span
                className={`shrink-0 h-2.5 w-2.5 rounded-full ring-2 ${o.dotClass}`}
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

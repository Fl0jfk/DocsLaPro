"use client";

import { useMemo, useState } from "react";
import { isCorbeilleStackKey, stackGroupLabel } from "@/app/lib/requests-view-utils";

type StackItem = {
  id: string;
  subject: string;
  requesterName: string;
  status: string;
  assigneeLabel?: string;
  directionHint?: string;
};

type StackGroup = {
  id: string;
  label: string;
  items: StackItem[];
  tone: "corbeille" | "service" | "personal";
};

function normEmail(e: string) {
  return e.trim().toLowerCase();
}

const TONE_STYLES = {
  corbeille: {
    card: "border-rose-200 bg-gradient-to-br from-rose-50 to-white",
    badge: "text-rose-700 bg-rose-100 border-rose-200",
    count: "text-rose-600",
  },
  service: {
    card: "border-red-200 bg-gradient-to-br from-red-50 to-white",
    badge: "text-red-800 bg-red-100 border-red-200",
    count: "text-red-600",
  },
  personal: {
    card: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
    badge: "text-amber-800 bg-amber-100 border-amber-200",
    count: "text-amber-600",
  },
};

export default function RequestInboxStacks({
  items,
  userEmail,
  onSelect,
}: {
  items: Array<{
    id: string;
    subject: string;
    status: string;
    requester: { fullName: string };
    assignedTo: {
      roleLabel: string;
      routeId?: string;
      unit?: string;
      claimedBy?: { email: string; name?: string } | null;
    };
    routing?: { directionHint?: { label: string } };
    boardColumn?: string | null;
  }>;
  userEmail: string;
  onSelect: (id: string) => void;
}) {
  const [openStackId, setOpenStackId] = useState<string | null>(null);

  const stacks = useMemo(() => {
    const u = normEmail(userEmail);
    const active = items.filter((r) => r.status === "NOUVELLE" || r.status === "EN_COURS" || r.status === "EN_ATTENTE");
    const personal: StackItem[] = [];
    const byService = new Map<string, StackItem[]>();

    for (const r of active) {
      const claimed = r.assignedTo.claimedBy?.email;
      const item: StackItem = {
        id: r.id,
        subject: r.subject,
        requesterName: r.requester.fullName,
        status: r.status,
        assigneeLabel: claimed ? r.assignedTo.claimedBy?.name || claimed : undefined,
        directionHint: r.routing?.directionHint?.label,
      };
      if (claimed && normEmail(claimed) === u) {
        personal.push(item);
        continue;
      }
      const branch = r.assignedTo.routeId || r.assignedTo.unit || "service";
      const key = isCorbeilleStackKey(branch) ? "corbeille" : branch;
      const list = byService.get(key) ?? [];
      list.push(item);
      byService.set(key, list);
    }

    const groups: StackGroup[] = [];
    if (personal.length > 0) {
      groups.push({
        id: "personal",
        label: stackGroupLabel("personal", "", true),
        items: personal,
        tone: "personal",
      });
    }
    const corbeille = byService.get("corbeille");
    if (corbeille?.length) {
      groups.push({
        id: "corbeille",
        label: stackGroupLabel("corbeille", "Corbeille établissement", false),
        items: corbeille,
        tone: "corbeille",
      });
      byService.delete("corbeille");
    }
    for (const [id, list] of byService) {
      const ref = items.find((x) => x.id === list[0]?.id);
      const roleLabel = ref?.assignedTo.roleLabel ?? id;
      groups.push({
        id,
        label: stackGroupLabel(id, roleLabel, false),
        items: list,
        tone: "service",
      });
    }
    return groups.sort((a, b) => b.items.length - a.items.length);
  }, [items, userEmail]);

  if (stacks.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Piles à traiter</h2>
      <div className="flex flex-wrap gap-4">
        {stacks.map((stack) => {
          const styles = TONE_STYLES[stack.tone];
          const isOpen = openStackId === stack.id;
          return (
            <div
              key={stack.id}
              className="relative w-[min(100%,210px)]"
            >
              <button
                type="button"
                className={`relative h-36 w-full cursor-pointer rounded-2xl ${styles.card} border shadow-sm text-left`}
                onClick={() => setOpenStackId((id) => (id === stack.id ? null : stack.id))}
              >
                {stack.items.slice(0, 4).map((card, i) => (
                  <div
                    key={card.id}
                    className="absolute inset-x-1 top-1 rounded-xl border border-white/80 bg-white/95 shadow-md px-3 py-2 transition-all duration-300"
                    style={{
                      transform: `translateY(${i * 6}px) rotate(${(i - 1) * 2}deg)`,
                      zIndex: 10 - i,
                      opacity: i === 0 ? 1 : 0.92 - i * 0.08,
                    }}
                  >
                    <p className={`text-[9px] font-bold uppercase tracking-wide truncate px-1.5 py-0.5 rounded-full border inline-block ${styles.badge}`}>
                      {stack.label}
                    </p>
                    <p className="text-xs font-black text-slate-900 line-clamp-2 mt-1">{card.subject}</p>
                    {card.status === "EN_ATTENTE" ? (
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wide text-orange-800 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded-full">
                        En attente
                      </span>
                    ) : null}
                    {card.directionHint ? (
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                        Probablement direction
                      </span>
                    ) : null}
                    {card.assigneeLabel ? (
                      <p className="text-[9px] text-slate-500 mt-1 truncate">→ {card.assigneeLabel}</p>
                    ) : null}
                  </div>
                ))}
              </button>
              <button
                type="button"
                className="w-full text-center text-xs font-bold text-slate-700 mt-2 hover:text-slate-900"
                onClick={() => setOpenStackId((id) => (id === stack.id ? null : stack.id))}
              >
                {stack.label}{" "}
                <span className={`font-black ${styles.count}`}>({stack.items.length})</span>
                <span className="block text-[9px] font-medium text-slate-400 mt-0.5">
                  {isOpen ? "Cliquer pour fermer" : "Cliquer pour voir la liste"}
                </span>
              </button>
              {isOpen ? (
                <div className="absolute left-0 right-0 top-full mt-1 z-30">
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 max-h-52 overflow-y-auto space-y-1">
                    {stack.items.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        className="w-full text-left rounded-xl hover:bg-slate-50 px-2 py-1.5"
                        onClick={() => {
                          onSelect(card.id);
                          setOpenStackId(null);
                        }}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-slate-800 line-clamp-1 flex-1 min-w-0">{card.subject}</p>
                          {card.status === "EN_ATTENTE" ? (
                            <span className="text-[8px] font-bold uppercase text-orange-700 bg-orange-50 px-1 rounded">Attente</span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-slate-500">{card.requesterName}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

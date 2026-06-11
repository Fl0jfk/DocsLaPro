"use client";

import type { TravelsHubTab } from "@/app/lib/travels-types";
import { TRAVELS_HUB_TABS } from "@/app/lib/travels-types";

export function TripHubNav({
  active,
  onChange,
  badges,
  tabs = TRAVELS_HUB_TABS,
}: {
  active: TravelsHubTab;
  onChange: (tab: TravelsHubTab) => void;
  badges?: Partial<Record<TravelsHubTab, number>>;
  tabs?: typeof TRAVELS_HUB_TABS;
}) {
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const badge = badges?.[tab.id];
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isActive
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-200 hover:text-indigo-700"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {badge != null && badge > 0 && (
              <span
                className={`ml-1 min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                  isActive ? "bg-white/25 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

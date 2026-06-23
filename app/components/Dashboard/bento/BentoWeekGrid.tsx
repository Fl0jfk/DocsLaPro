"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { calendarDateKeyParis } from "@/app/lib/domain-planning-dates";
import {
  DASHBOARD_ABSENCES_MAX_SLOTS,
  DashboardColumnScrollHint,
  DashboardScrollList,
  absencesTodayCountLabel,
  dashboardScrollListStyle,
} from "@/app/components/Dashboard/DashboardScrollList";

export type WeekDayColumn = {
  key: string;
  short: string;
  items: ReactNode[];
};

export function bentoWeekDayColumnClass(isToday: boolean, extra = ""): string {
  return `flex min-w-0 flex-col rounded-md ${
    isToday
      ? "border-2 border-[var(--dash-primary)] bg-[color:var(--dash-soft-muted)]/55 shadow-sm"
      : "border border-[color:var(--dash-border)]/90 bg-[color:var(--dash-soft-muted)]/25"
  } ${extra}`.trim();
}

export function bentoWeekDayLabelClass(isToday: boolean): string {
  return `shrink-0 truncate text-center text-[10px] font-black uppercase tracking-tight sm:text-[9px] ${
    isToday ? "text-[var(--dash-primary)]" : "text-[var(--dash-mid)]"
  }`;
}

function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export default function BentoWeekGrid({
  days,
  fill,
  expand,
  maxVisibleSlots,
}: {
  days: WeekDayColumn[];
  fill?: boolean;
  /** Tous les créneaux visibles, hauteur libre (pas de scroll ni max-height). */
  expand?: boolean;
  /** Limite le nombre de lignes visibles par colonne (scroll interne). */
  maxVisibleSlots?: number;
}) {
  const isMobile = useMobileViewport();
  const todayKey = calendarDateKeyParis();

  const visibleDays = useMemo(() => {
    if (!isMobile) return days;
    const today = days.find((day) => day.key === todayKey);
    if (today) return [today];
    const short = new Date()
      .toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "short" })
      .replace(".", "")
      .slice(0, 3);
    return [{ key: todayKey, short, items: [] }];
  }, [days, isMobile, todayKey]);

  return (
    <div
      className={`grid gap-1 ${fill ? "h-full min-h-0" : ""}`}
      style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))` }}
    >
      {visibleDays.map((day) => {
        const isToday = day.key === todayKey;
        return (
        <div
          key={day.key}
          className={`${bentoWeekDayColumnClass(isToday, `p-1.5 sm:p-1 ${fill ? "min-h-0 h-full" : ""}`)}`}
        >
          <p className={bentoWeekDayLabelClass(isToday)}>
            {day.short}
          </p>
          <div className="mt-1 flex min-h-0 flex-col sm:mt-1">
            <div
              className={
                fill
                  ? "min-h-0 flex-1 overflow-y-auto"
                  : maxVisibleSlots
                    ? "min-h-0 space-y-1 overflow-y-auto sm:space-y-1"
                    : expand
                      ? "space-y-1 sm:space-y-1"
                      : "min-h-[2.5rem] max-h-28 space-y-1 overflow-y-auto sm:space-y-1"
              }
              style={maxVisibleSlots ? dashboardScrollListStyle(maxVisibleSlots, "card") : undefined}
            >
              {day.items.length === 0 ? (
                <span className="block pt-1 text-center text-[9px] text-stone-300">—</span>
              ) : (
                day.items
              )}
            </div>
            {maxVisibleSlots ? (
              <DashboardColumnScrollHint totalCount={day.items.length} maxSlots={maxVisibleSlots} />
            ) : null}
          </div>
        </div>
        );
      })}
    </div>
  );
}

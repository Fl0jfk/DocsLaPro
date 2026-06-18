"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { calendarDateKeyParis } from "@/app/lib/domain-planning-dates";

export type WeekDayColumn = {
  key: string;
  short: string;
  items: ReactNode[];
};

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
}: {
  days: WeekDayColumn[];
  fill?: boolean;
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
          className={`flex min-w-0 flex-col rounded-md p-1.5 sm:p-1 ${
            isToday
              ? "border-2 border-[var(--dash-primary)] bg-[color:var(--dash-soft-muted)]/55 shadow-sm"
              : "border border-[color:var(--dash-border)]/90 bg-[color:var(--dash-soft-muted)]/25"
          } ${fill ? "min-h-0 h-full" : ""}`}
        >
          <p
            className={`shrink-0 truncate text-center text-[10px] font-black uppercase tracking-tight sm:text-[9px] ${
              isToday ? "text-[var(--dash-primary)]" : "text-[var(--dash-mid)]"
            }`}
          >
            {day.short}
          </p>
          <div
            className={`mt-1 space-y-1 overflow-y-auto sm:mt-0.5 sm:space-y-px ${
              fill ? "min-h-0 flex-1" : "min-h-[2.5rem] max-h-28"
            }`}
          >
            {day.items.length === 0 ? (
              <span className="block pt-1 text-center text-[9px] text-stone-300">—</span>
            ) : (
              day.items
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}

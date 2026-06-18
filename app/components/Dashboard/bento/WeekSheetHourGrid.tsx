"use client";

import { useEffect, useState } from "react";
import {
  WEEK_DAYS,
  type WeekDayKey,
  type WeekSheetEvent,
} from "@/app/lib/dashboard-week-sheet-types";
import {
  formatMinutesAsHour,
  getWeekSheetDisplayBounds,
  getWeekSheetDisplayHours,
  getWeekSheetGridPixelHeight,
  layoutDayEvents,
} from "@/app/lib/dashboard-week-sheet-time";
import WeekSheetEventBlock from "@/app/components/Dashboard/bento/WeekSheetEventBlock";
import { todaySchoolWeekDayIndex } from "@/app/lib/dashboard-week";

function eventsForDay(events: WeekSheetEvent[], day: WeekDayKey) {
  return events.filter((ev) => ev.day === day);
}

const PX_PER_HOUR = 40;

export default function WeekSheetHourGrid({
  events,
  compact,
}: {
  events: WeekSheetEvent[];
  compact?: boolean;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const pxPerHour = compact ? 34 : PX_PER_HOUR;
  const pxPerMinute = pxPerHour / 60;
  const minEventPx = compact ? 20 : 24;
  const { startMin, endMin } = getWeekSheetDisplayBounds();
  const hours = getWeekSheetDisplayHours();
  const totalHeight = getWeekSheetGridPixelHeight(events, pxPerMinute, minEventPx);
  const gutterWidth = compact ? "2.5rem" : "3rem";
  const todayKey: WeekDayKey | null = (() => {
    const idx = todaySchoolWeekDayIndex();
    const keys: WeekDayKey[] = ["mon", "tue", "wed", "thu", "fri"];
    return idx >= 0 ? keys[idx] : null;
  })();
  const visibleDays = isMobile && todayKey ? WEEK_DAYS.filter((d) => d.key === todayKey) : WEEK_DAYS;

  const todayColClass =
    "ring-2 ring-[var(--dash-primary)] ring-inset bg-[color:var(--dash-soft-muted)]/40";

  return (
    <div className="w-full min-w-0 overflow-visible">
      <div
        className="grid gap-px overflow-visible rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-soft)]/80 text-[11px] sm:text-xs"
        style={{
          gridTemplateColumns: `${gutterWidth} repeat(${visibleDays.length}, minmax(0, 1fr))`,
        }}
      >
        <div className="bg-[color:var(--dash-soft-muted)]/90 p-1" />
        {visibleDays.map((d) => (
          <div
            key={d.key}
            className={`bg-[color:var(--dash-soft-muted)]/90 px-2 py-1.5 text-center text-[11px] font-black uppercase tracking-tight sm:text-xs ${
              todayKey === d.key ? "text-[var(--dash-primary)] ring-2 ring-[var(--dash-primary)] ring-inset" : "text-[var(--dash-mid)]"
            }`}
          >
            {d.short}
          </div>
        ))}

        <div className="relative overflow-visible bg-white/95" style={{ height: totalHeight }}>
          {hours.map((hour) => {
            const top = (hour * 60 - startMin) * pxPerMinute;
            if (top > totalHeight) return null;
            return (
              <div
                key={hour}
                className="pointer-events-none absolute right-0 left-0 flex items-start justify-end border-t border-[color:var(--dash-soft-muted)]/90 pr-1.5"
                style={{ top, height: pxPerHour }}
              >
                <span className="-mt-2 text-[11px] font-bold tabular-nums text-stone-400 sm:text-xs">
                  {formatMinutesAsHour(hour * 60)}
                </span>
              </div>
            );
          })}
        </div>

        {visibleDays.map((d) => {
          const dayLayouts = layoutDayEvents(
            eventsForDay(events, d.key),
            startMin,
            endMin,
            pxPerMinute,
            minEventPx,
          );

          return (
            <div
              key={d.key}
              className={`relative overflow-visible border-l border-[color:var(--dash-soft-muted)]/80 bg-white/95 ${
                todayKey === d.key ? todayColClass : ""
              }`}
              style={{ height: totalHeight }}
            >
              {hours.map((hour) => {
                const top = (hour * 60 - startMin) * pxPerMinute;
                if (top > totalHeight) return null;
                return (
                  <div
                    key={hour}
                    className="pointer-events-none absolute right-0 left-0 border-t border-[color:var(--dash-soft-muted)]/70"
                    style={{ top }}
                  />
                );
              })}

              {dayLayouts.map(({ event, top, height, column, columnCount }) => {
                const widthPct = 100 / columnCount;
                const leftPct = column * widthPct;
                return (
                  <WeekSheetEventBlock
                    key={event.id}
                    event={event}
                    top={top}
                    height={height}
                    left={`calc(${leftPct}% + 2px)`}
                    width={`calc(${widthPct}% - 4px)`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

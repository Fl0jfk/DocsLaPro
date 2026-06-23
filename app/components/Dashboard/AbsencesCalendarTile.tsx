"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import type { Categories } from "@/app/contexts/data";
import { canViewCalendar } from "@/app/lib/absences-types";
import { absencesToday, type AbsenceTodayRow } from "@/app/lib/dashboard-absences";
import {
  DASHBOARD_TILE_HIGHLIGHT,
  DASHBOARD_TILE_META,
  DASHBOARD_TILE_META_STRONG,
} from "@/app/lib/dashboard-theme";
import { DashboardScrollList, absencesTodayCountLabel } from "@/app/components/Dashboard/DashboardScrollList";
import TileShell from "./TileShell";

export default function AbsencesCalendarTile({
  category,
  priority,
}: {
  category: Categories;
  priority?: boolean;
}) {
  const { user, isLoaded } = useUser();
  const [rows, setRows] = useState<AbsenceTodayRow[]>([]);

  const roles = useMemo(() => {
    const rolesRaw = user?.publicMetadata?.role;
    return Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  }, [user]);

  const showTodayPreview = isLoaded && canViewCalendar(roles);

  useEffect(() => {
    if (!showTodayPreview) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/absences?calendar=true&today=true", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setRows(absencesToday(Array.isArray(data) ? data : []));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showTodayPreview]);

  return (
    <TileShell
      name={category.name}
      img={category.img}
      link={category.link}
      priority={priority}
      pulse={showTodayPreview && rows.length > 0}
    >
      {!showTodayPreview ? (
        <p className={`${DASHBOARD_TILE_META} pointer-events-none`}>
          Déclarer et suivre vos absences
        </p>
      ) : rows.length > 0 ? (
        <div
          className="pointer-events-auto min-h-0 space-y-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <p className={`${DASHBOARD_TILE_META_STRONG} shrink-0`}>
            {absencesTodayCountLabel(rows.length)}
          </p>
          <DashboardScrollList totalCount={rows.length} slotSize="compact">
            <div className="space-y-0.5">
              {rows.map((r) => (
                <p key={r.id} className={DASHBOARD_TILE_HIGHLIGHT}>
                  · {r.teacherName}
                  {r.examType ? ` — ${r.examType}` : ""} ({r.timeLabel})
                </p>
              ))}
            </div>
          </DashboardScrollList>
        </div>
      ) : (
        <p className={`${DASHBOARD_TILE_META} pointer-events-none`}>
          Personne d&apos;absent aujourd&apos;hui
        </p>
      )}
    </TileShell>
  );
}

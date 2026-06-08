"use client";

import { useEffect, useState } from "react";
import type { Categories } from "@/app/contexts/data";
import { absencesToday, type AbsenceTodayRow } from "@/app/lib/dashboard-absences";
import TileShell from "./TileShell";

export default function AbsencesCalendarTile({ category, priority }: { category: Categories; priority?: boolean }) {
  const [rows, setRows] = useState<AbsenceTodayRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/convocations", { cache: "no-store" });
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
  }, []);

  return (
    <TileShell
      name={category.name}
      img={category.img}
      link={category.link}
      priority={priority}
      pulse={rows.length > 0}
    >
      {rows.length > 0 ? (
        <div className="space-y-1 max-h-[88px] overflow-y-auto pointer-events-none">
          <p className="text-xs font-black uppercase tracking-wide text-sky-200 drop-shadow">
            Absent{rows.length > 1 ? "s" : ""} aujourd&apos;hui
          </p>
          {rows.slice(0, 4).map((r) => (
            <p key={r.id} className="text-xs text-white/95 line-clamp-1 drop-shadow">
              · {r.teacherName}
              {r.examType ? ` — ${r.examType}` : ""} ({r.timeLabel})
            </p>
          ))}
          {rows.length > 4 && <p className="text-[10px] text-white/75">+{rows.length - 4} autre(s)</p>}
        </div>
      ) : (
        <p className="text-xs text-white/70 pointer-events-none">Personne d&apos;absent aujourd&apos;hui</p>
      )}
    </TileShell>
  );
}

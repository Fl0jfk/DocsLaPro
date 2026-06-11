"use client";



import { useUser } from "@clerk/nextjs";

import { useEffect, useMemo, useState } from "react";

import type { Categories } from "@/app/contexts/data";

import { canViewCalendar } from "@/app/lib/absences-types";

import { absencesToday, type AbsenceTodayRow } from "@/app/lib/dashboard-absences";

import TileShell from "./TileShell";



export default function AbsencesCalendarTile({ category, priority }: { category: Categories; priority?: boolean }) {

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

        <p className="text-xs text-white/70 pointer-events-none">Déclarer et suivre vos absences</p>

      ) : rows.length > 0 ? (

        <div

          className="pointer-events-auto space-y-1 min-h-0"

          onClick={(e) => e.stopPropagation()}

          onKeyDown={(e) => e.stopPropagation()}

        >

          <p className="text-xs font-black uppercase tracking-wide text-sky-200 drop-shadow shrink-0">

            {rows.length} absent{rows.length > 1 ? "s" : ""} aujourd&apos;hui

          </p>

          <div className="max-h-[150px] overflow-y-auto overscroll-contain space-y-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

            {rows.map((r) => (

              <p key={r.id} className="text-xs text-white/95 drop-shadow leading-snug">

                · {r.teacherName}

                {r.examType ? ` — ${r.examType}` : ""} ({r.timeLabel})

              </p>

            ))}

          </div>

        </div>

      ) : (

        <p className="text-xs text-white/70 pointer-events-none">Personne d&apos;absent aujourd&apos;hui</p>

      )}

    </TileShell>

  );

}


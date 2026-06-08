"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Categories } from "@/app/contexts/data";
import { tripsToday, type TripIndexRow } from "@/app/lib/dashboard-trips";
import TileShell from "./TileShell";

export default function TravelsTile({ category, priority }: { category: Categories; priority?: boolean }) {
  const router = useRouter();
  const [todayTrips, setTodayTrips] = useState<TripIndexRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/travels/list", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as TripIndexRow[];
        if (!cancelled) setTodayTrips(tripsToday(Array.isArray(data) ? data : []));
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
      pulse={todayTrips.length > 0}
      footer={
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push("/travels?new=1");
          }}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg transition"
        >
          + Nouvelle sortie
        </button>
      }
    >
      {todayTrips.length > 0 ? (
        <div className="pointer-events-none space-y-1">
          <p className="text-xs font-black uppercase tracking-wide text-amber-300 drop-shadow">
            Sortie{todayTrips.length > 1 ? "s" : ""} aujourd&apos;hui
          </p>
          {todayTrips.slice(0, 3).map((t) => (
            <p key={t.id} className="text-sm font-semibold text-white/95 line-clamp-1 drop-shadow">
              · {t.data?.title || "Sans titre"}
            </p>
          ))}
          {todayTrips.length > 3 && (
            <p className="text-xs text-white/80">+{todayTrips.length - 3} autre(s)</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-white/70">Aucune sortie prévue aujourd&apos;hui</p>
      )}
    </TileShell>
  );
}

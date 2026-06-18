"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Categories } from "@/app/contexts/data";
import { tripsToday, type TripIndexRow } from "@/app/lib/dashboard-trips";
import {
  DASHBOARD_BTN_INDIGO,
  DASHBOARD_TILE_HIGHLIGHT,
  DASHBOARD_TILE_META,
  DASHBOARD_TILE_META_STRONG,
} from "@/app/lib/dashboard-theme";
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
          className={DASHBOARD_BTN_INDIGO}
        >
          + Nouvelle sortie
        </button>
      }
    >
      {todayTrips.length > 0 ? (
        <div className="pointer-events-none space-y-1">
          <p className={DASHBOARD_TILE_META_STRONG}>
            Sortie{todayTrips.length > 1 ? "s" : ""} aujourd&apos;hui
          </p>
          {todayTrips.slice(0, 3).map((t) => (
            <p key={t.id} className={`${DASHBOARD_TILE_HIGHLIGHT} line-clamp-1`}>
              · {t.data?.title || "Sans titre"}
            </p>
          ))}
          {todayTrips.length > 3 && (
            <p className={DASHBOARD_TILE_META}>+{todayTrips.length - 3} autre(s)</p>
          )}
        </div>
      ) : (
        <p className={DASHBOARD_TILE_META}>Aucune sortie prévue aujourd&apos;hui</p>
      )}
    </TileShell>
  );
}

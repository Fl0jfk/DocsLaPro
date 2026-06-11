"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { Categories } from "@/app/contexts/data";
import { canViewPersonnelDashboard } from "@/app/lib/personnel-types";
import type { PersonnelDashboardData } from "@/app/lib/personnel-dashboard";
import TileShell from "./TileShell";

export default function PersonnelOgecTile({ category, priority }: { category: Categories; priority?: boolean }) {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState<PersonnelDashboardData | null>(null);

  const roles = useMemo(() => {
    const rolesRaw = user?.publicMetadata?.role;
    return Array.isArray(rolesRaw) ? rolesRaw.map(String) : rolesRaw ? [String(rolesRaw)] : [];
  }, [user?.publicMetadata?.role]);

  const isRh = useMemo(() => canViewPersonnelDashboard(roles), [roles]);

  useEffect(() => {
    if (!isLoaded || !isRh) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/personnel/dashboard", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const j = await res.json();
        if (!cancelled) setData(j);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isRh]);

  const total =
    data
      ? data.counts.onboardings +
        data.counts.signatures +
        data.counts.habilitations +
        data.counts.formations +
        data.counts.medecine +
        data.counts.entretiens
      : 0;

  return (
    <TileShell
      name={category.name}
      img={category.img}
      link={category.link}
      priority={priority}
      pulse={total > 0 || (data?.counts.absencesToday ?? 0) > 0}
    >
      {isRh && data ? (
        <div className="pointer-events-none space-y-1">
          {total > 0 ? (
            <>
              <p className="text-xs font-black uppercase tracking-wide text-violet-200 drop-shadow">
                {total} action{total > 1 ? "s" : ""} RH
              </p>
              {data.counts.signatures > 0 && (
                <p className="text-sm font-semibold text-white/95 drop-shadow">
                  · {data.counts.signatures} signature{data.counts.signatures > 1 ? "s" : ""}
                </p>
              )}
              {data.counts.absencesToday > 0 && (
                <p className="text-sm font-semibold text-rose-200 drop-shadow">
                  · {data.counts.absencesToday} absent{data.counts.absencesToday > 1 ? "s" : ""}
                </p>
              )}
            </>
          ) : data.counts.absencesToday > 0 ? (
            <p className="text-sm font-semibold text-rose-200 drop-shadow">
              {data.counts.absencesToday} absent{data.counts.absencesToday > 1 ? "s" : ""} aujourd&apos;hui
            </p>
          ) : (
            <p className="text-xs text-white/70">Tout est à jour</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-white/70">Mon dossier personnel</p>
      )}
    </TileShell>
  );
}

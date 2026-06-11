"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Categories } from "@/app/contexts/data";
import TileShell from "./TileShell";

type RollStatus = "validee" | "en_cours" | "non_demarre";

export default function InternatTile({ category, priority }: { category: Categories; priority?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<RollStatus>("non_demarre");
  const [activeStudents, setActiveStudents] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/internat/stats", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const s = data?.stats?.tonightRollCall?.status as RollStatus | undefined;
        if (!cancelled) {
          setStatus(s === "validee" || s === "en_cours" ? s : "non_demarre");
          setActiveStudents(
            typeof data?.stats?.activeStudents === "number" ? data.stats.activeStudents : null,
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusLabel =
    status === "validee"
      ? "Appel du soir validé"
      : status === "en_cours"
        ? "Appel en cours"
        : "Appel à faire ce soir";

  return (
    <TileShell
      name={category.name}
      link={category.link}
      img={category.img}
      priority={priority}
      pulse={status === "en_cours"}
      footer={
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push("/gestion-internat?tab=appel");
          }}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-lg transition"
        >
          Appel du soir
        </button>
      }
    >
      <div className="pointer-events-none space-y-1">
        <p
          className={`text-xs font-black uppercase tracking-wide drop-shadow ${
            status === "validee"
              ? "text-emerald-300"
              : status === "en_cours"
                ? "text-amber-300"
                : "text-white/80"
          }`}
        >
          {statusLabel}
        </p>
        {activeStudents != null && (
          <p className="text-sm font-semibold text-white/95 drop-shadow">
            {activeStudents} interne{activeStudents > 1 ? "s" : ""} actif{activeStudents > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </TileShell>
  );
}

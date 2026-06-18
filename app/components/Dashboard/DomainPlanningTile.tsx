"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Categories } from "@/app/contexts/data";
import { calendarDateKeyParis } from "@/app/lib/domain-planning-dates";
import {
  DASHBOARD_BTN_VIOLET,
  DASHBOARD_TILE_HIGHLIGHT,
  DASHBOARD_TILE_META,
  DASHBOARD_SELECT,
} from "@/app/lib/dashboard-theme";
import TileShell from "./TileShell";

type Domain = { id: string; name: string };
type Booking = {
  id: string;
  domainId: string;
  startsAt: string;
  activityLabel?: string;
  className: string;
  lastName: string;
  status?: string;
};

export default function DomainPlanningTile({ category, priority }: { category: Categories; priority?: boolean }) {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [domainId, setDomainId] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [domainsRes, bookingsRes] = await Promise.all([
          fetch("/api/domain-planning/domains", { cache: "no-store" }),
          fetch("/api/domain-planning/bookings", { cache: "no-store" }),
        ]);
        if (cancelled) return;
        if (domainsRes.ok) {
          const dj = await domainsRes.json();
          const list = (dj.domains || []) as Domain[];
          setDomains(list);
          if (list[0]) setDomainId(list[0].id);
        }
        if (bookingsRes.ok) {
          const bj = await bookingsRes.json();
          setBookings((bj.bookings || []) as Booking[]);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const todayForDomain = useMemo(() => {
    const day = calendarDateKeyParis();
    return bookings
      .filter((b) => b.status !== "CANCELLED" && b.domainId === domainId && b.startsAt.startsWith(day))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [bookings, domainId]);

  const domainName = domains.find((d) => d.id === domainId)?.name || "Domaine";

  return (
    <TileShell
      name={category.name}
      img={category.img}
      link={category.link}
      priority={priority}
      footer={
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push("/domain-planning?new=1#form-section");
          }}
          className={DASHBOARD_BTN_VIOLET}
        >
          + Réserver un créneau
        </button>
      }
    >
      <div className="pointer-events-auto space-y-2" onClick={(e) => e.stopPropagation()}>
        <select
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          className={DASHBOARD_SELECT}
        >
          {domains.length === 0 ? (
            <option value="">Chargement domaines…</option>
          ) : (
            domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))
          )}
        </select>
        {todayForDomain.length > 0 ? (
          <div className="space-y-0.5 max-h-[72px] overflow-y-auto">
            {todayForDomain.slice(0, 4).map((b) => (
              <p key={b.id} className={`${DASHBOARD_TILE_HIGHLIGHT} line-clamp-1`}>
                {b.startsAt.split("T")[1].slice(0, 5).replace(":", "h")} — {b.activityLabel || domainName} ({b.className})
              </p>
            ))}
          </div>
        ) : (
          <p className={DASHBOARD_TILE_META}>Aucun créneau aujourd&apos;hui pour ce domaine</p>
        )}
      </div>
    </TileShell>
  );
}

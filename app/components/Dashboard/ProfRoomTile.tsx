"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Categories } from "@/app/contexts/data";
import {
  DASHBOARD_BTN_EMERALD,
  DASHBOARD_TILE_HIGHLIGHT,
  DASHBOARD_TILE_META,
  DASHBOARD_TILE_META_STRONG,
  DASHBOARD_SELECT,
} from "@/app/lib/dashboard-theme";
import TileShell from "./TileShell";

type Room = { id: string; name: string };
type Reservation = {
  id: string;
  roomId: string;
  startsAt: string;
  subject: string;
  className: string;
  lastName: string;
  status?: string;
};

function todayKeyParis() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

export default function ProfRoomTile({ category, priority }: { category: Categories; priority?: boolean }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [roomsRes, resRes] = await Promise.all([
          fetch("/api/reservation-rooms/rooms", { cache: "no-store" }),
          fetch("/api/reservation-rooms/reservations", { cache: "no-store" }),
        ]);
        if (cancelled) return;
        if (roomsRes.ok) {
          const rj = await roomsRes.json();
          const list = (rj.rooms || []) as Room[];
          setRooms(list);
          if (list[0]) setRoomId(list[0].id);
        }
        if (resRes.ok) {
          const rj = await resRes.json();
          setReservations((rj.reservations || []) as Reservation[]);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const todayForRoom = useMemo(() => {
    const day = todayKeyParis();
    return reservations
      .filter((r) => r.status !== "CANCELLED" && r.roomId === roomId && r.startsAt.startsWith(day))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [reservations, roomId]);

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
            router.push("/prof-room?new=1#form-section");
          }}
          className={DASHBOARD_BTN_EMERALD}
        >
          + Faire une réservation
        </button>
      }
    >
      <div className="pointer-events-auto space-y-2" onClick={(e) => e.stopPropagation()}>
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className={DASHBOARD_SELECT}
        >
          {rooms.length === 0 ? (
            <option value="">Chargement salles…</option>
          ) : (
            rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))
          )}
        </select>
        {todayForRoom.length > 0 ? (
          <div className="space-y-0.5 max-h-[72px] overflow-y-auto">
            {todayForRoom.slice(0, 4).map((r) => (
              <p key={r.id} className={`${DASHBOARD_TILE_HIGHLIGHT} line-clamp-1`}>
                {r.startsAt.split("T")[1].slice(0, 5).replace(":", "h")} — {r.subject} ({r.className})
              </p>
            ))}
          </div>
        ) : (
          <p className={DASHBOARD_TILE_META}>Aucune réservation aujourd&apos;hui pour cette salle</p>
        )}
      </div>
    </TileShell>
  );
}

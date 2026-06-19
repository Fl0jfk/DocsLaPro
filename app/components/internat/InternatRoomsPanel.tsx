"use client";

import { useMemo, useState } from "react";
import type { InternatBuilding, InternatFloor, InternatRoom, InternatStudent } from "@/app/lib/internat-types";
import {
  roomLocationLabel,
  sortInternatFloors,
  studentDisplayName,
  usableInternatFloors,
} from "@/app/lib/internat-types";
import InternatBuildingsPanel from "@/app/components/internat/InternatBuildingsPanel";

const WING_LABELS: Record<string, string> = {
  garcons: "Garçons",
  filles: "Filles",
  mixte: "Mixte",
};

function wingLabel(wing?: string) {
  return wing ? WING_LABELS[wing] || wing : null;
}

export default function InternatRoomsPanel({
  rooms,
  buildings,
  students,
  canManage,
  onRefresh,
}: {
  rooms: InternatRoom[];
  buildings: InternatBuilding[];
  students: InternatStudent[];
  canManage: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState<2 | 3>(2);
  const [wing, setWing] = useState<"garcons" | "filles" | "mixte" | "">("");
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuildings, setShowBuildings] = useState(true);

  const selectedBuilding = buildings.find((b) => b.id === buildingId);
  const usableFloors = selectedBuilding ? usableInternatFloors(selectedBuilding) : [];

  const occupants = (roomId: string) =>
    students.filter((s) => s.actif && s.roomId === roomId);

  const groupedRooms = useMemo(() => {
    const unassigned: InternatRoom[] = [];
    const byBuilding = new Map<string, Map<string, InternatRoom[]>>();

    for (const room of rooms) {
      if (!room.buildingId || !room.floorId) {
        unassigned.push(room);
        continue;
      }
      if (!byBuilding.has(room.buildingId)) byBuilding.set(room.buildingId, new Map());
      const byFloor = byBuilding.get(room.buildingId)!;
      if (!byFloor.has(room.floorId)) byFloor.set(room.floorId, []);
      byFloor.get(room.floorId)!.push(room);
    }

    return { unassigned, byBuilding };
  }, [rooms]);

  const buildingSummary = (building: InternatBuilding) => {
    const buildingRooms = rooms.filter((r) => r.buildingId === building.id);
    const beds = buildingRooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupied = buildingRooms.reduce((sum, r) => sum + occupants(r.id).length, 0);
    const activeFloors = usableInternatFloors(building).length;
    return { rooms: buildingRooms.length, beds, occupied, activeFloors };
  };

  const saveRoom = async () => {
    if (!canManage) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/internat/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          label,
          capacity,
          wing: wing || undefined,
          buildingId: buildingId || undefined,
          floorId: floorId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setLabel("");
      setFloorId("");
      await onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const deleteRoom = async (id: string) => {
    if (!canManage || !confirm("Supprimer cette chambre ?")) return;
    setBusy(true);
    try {
      await fetch("/api/internat/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const renderRoomCard = (room: InternatRoom) => {
    const occ = occupants(room.id);
    const full = occ.length >= room.capacity;
    return (
      <div
        key={room.id}
        className={`rounded-2xl border p-4 ${full ? "border-amber-300 bg-amber-50/50" : "border-slate-200 bg-white"}`}
      >
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="font-black text-slate-900">{room.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {room.capacity} places · {occ.length} occupant(s)
              {wingLabel(room.wing) ? ` · ${wingLabel(room.wing)}` : ""}
            </p>
            {!room.buildingId && (
              <p className="text-[10px] text-amber-700 font-semibold mt-1">Non classée</p>
            )}
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => deleteRoom(room.id)}
              className="text-xs text-red-600 font-bold hover:underline"
            >
              Suppr.
            </button>
          )}
        </div>
        <ul className="mt-3 text-sm text-slate-700 space-y-1">
          {occ.length === 0 ? (
            <li className="text-slate-400 italic">Vide</li>
          ) : (
            occ.map((s) => (
              <li key={s.id}>
                {studentDisplayName(s)} <span className="text-slate-400">({s.classe})</span>
              </li>
            ))
          )}
        </ul>
      </div>
    );
  };

  const renderFloorSection = (building: InternatBuilding, floor: InternatFloor, floorRooms: InternatRoom[]) => {
    const beds = floorRooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupied = floorRooms.reduce((sum, r) => sum + occupants(r.id).length, 0);
    return (
      <div key={floor.id} className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-bold text-slate-800">{floor.label}</h4>
          <p className="text-xs text-slate-500">
            {floorRooms.length} chambre(s) · {occupied}/{beds} place(s)
            {!floor.inUse ? " · étage inactif" : ""}
          </p>
        </div>
        {floorRooms.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Aucune chambre sur cet étage.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {floorRooms.map(renderRoomCard)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBuildings((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
        >
          <div>
            <h3 className="font-black text-slate-900">Bâtiments et étages</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {buildings.length} bâtiment(s) — configurez les étages (RDC, 1er, 2e…) et leur usage.
            </p>
          </div>
          <span className="text-slate-400 text-sm font-bold">{showBuildings ? "▲" : "▼"}</span>
        </button>
        {showBuildings ? (
          <div className="border-t border-slate-100 px-5 py-5">
            <InternatBuildingsPanel
              buildings={buildings}
              rooms={rooms}
              canManage={canManage}
              onRefresh={onRefresh}
            />
          </div>
        ) : null}
      </section>

      {canManage && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="font-black text-slate-900">Nouvelle chambre</h3>
          <div className="flex flex-wrap gap-3">
            <select
              className="border rounded-xl px-3 py-2 text-sm min-w-[10rem]"
              value={buildingId}
              onChange={(e) => {
                setBuildingId(e.target.value);
                setFloorId("");
              }}
            >
              <option value="">Bâtiment —</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
            <select
              className="border rounded-xl px-3 py-2 text-sm min-w-[10rem]"
              value={floorId}
              onChange={(e) => setFloorId(e.target.value)}
              disabled={!buildingId}
            >
              <option value="">Étage —</option>
              {usableFloors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <input
              className="border rounded-xl px-3 py-2 text-sm flex-1 min-w-[8rem]"
              placeholder="Ex. Ch. 12"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <select
              className="border rounded-xl px-3 py-2 text-sm"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value) === 3 ? 3 : 2)}
            >
              <option value={2}>2 places</option>
              <option value={3}>3 places</option>
            </select>
            <select
              className="border rounded-xl px-3 py-2 text-sm"
              value={wing}
              onChange={(e) => setWing(e.target.value as typeof wing)}
            >
              <option value="">Genre —</option>
              <option value="garcons">Garçons</option>
              <option value="filles">Filles</option>
              <option value="mixte">Mixte</option>
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={saveRoom}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
          {buildings.length === 0 && (
            <p className="text-xs text-amber-700">Créez d&apos;abord un bâtiment et au moins un étage actif.</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {buildings.map((building) => {
        const summary = buildingSummary(building);
        const floorMap = groupedRooms.byBuilding.get(building.id);
        const floors = sortInternatFloors(building.floors);

        return (
          <section key={building.id} className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">{building.label}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {summary.activeFloors} étage(s) actif(s) · {summary.rooms} chambre(s) ·{" "}
                  {summary.occupied}/{summary.beds} place(s)
                </p>
              </div>
            </div>

            {floors.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun étage configuré pour ce bâtiment.</p>
            ) : (
              <div className="space-y-6 pl-0 sm:pl-2 border-l-2 border-indigo-100">
                {floors.map((floor) => {
                  const floorRooms = floorMap?.get(floor.id) || [];
                  return (
                    <div key={floor.id} className="pl-4">
                      {renderFloorSection(building, floor, floorRooms)}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {groupedRooms.unassigned.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-black text-slate-900">Chambres non classées</h3>
          <p className="text-xs text-slate-500">
            Anciennes chambres sans bâtiment — recréez-les ou réaffectez via une future édition.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupedRooms.unassigned.map((room) => (
              <div key={room.id}>
                <p className="text-[10px] text-slate-400 mb-1">{roomLocationLabel(buildings, room)}</p>
                {renderRoomCard(room)}
              </div>
            ))}
          </div>
        </section>
      )}

      {rooms.length === 0 && buildings.length > 0 && (
        <p className="text-slate-500 text-sm">Aucune chambre configurée.</p>
      )}
    </div>
  );
}

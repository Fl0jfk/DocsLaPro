"use client";

import { useState } from "react";
import type { InternatRoom, InternatStudent } from "@/app/lib/internat-types";
import { studentDisplayName } from "@/app/lib/internat-types";

export default function InternatRoomsPanel({
  rooms,
  students,
  canManage,
  onRefresh,
}: {
  rooms: InternatRoom[];
  students: InternatStudent[];
  canManage: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState<2 | 3>(2);
  const [wing, setWing] = useState<"garcons" | "filles" | "mixte" | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const occupants = (roomId: string) =>
    students.filter((s) => s.actif && s.roomId === roomId);

  const saveRoom = async () => {
    if (!canManage) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/internat/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", label, capacity, wing: wing || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setLabel("");
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

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="font-black text-slate-900">Nouvelle chambre</h3>
          <div className="flex flex-wrap gap-3">
            <input
              className="border rounded-xl px-3 py-2 text-sm flex-1 min-w-[10rem]"
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
              <option value="">Aile —</option>
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
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rooms.map((room) => {
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
                    {room.wing ? ` · ${room.wing}` : ""}
                  </p>
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
        })}
      </div>
      {rooms.length === 0 && <p className="text-slate-500 text-sm">Aucune chambre configurée.</p>}
    </div>
  );
}

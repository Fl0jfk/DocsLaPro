"use client";

import { useState } from "react";
import type { InternatBuilding, InternatRoom } from "@/app/lib/internat-types";
import { sortInternatFloors } from "@/app/lib/internat-types";

const FLOOR_PRESETS = ["Rez-de-chaussée", "1er étage", "2e étage", "3e étage"];

async function apiPut(body: Record<string, unknown>) {
  const res = await fetch("/api/internat/buildings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Erreur");
  return data;
}

export default function InternatBuildingsPanel({
  buildings,
  rooms,
  canManage,
  onRefresh,
}: {
  buildings: InternatBuilding[];
  rooms: InternatRoom[];
  canManage: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [buildingLabel, setBuildingLabel] = useState("");
  const [floorLabels, setFloorLabels] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
      await onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const roomsInBuilding = (buildingId: string) => rooms.filter((r) => r.buildingId === buildingId);
  const roomsOnFloor = (buildingId: string, floorId: string) =>
    rooms.filter((r) => r.buildingId === buildingId && r.floorId === floorId);

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[12rem]">
            <label className="block text-xs font-bold text-slate-500 mb-1">Nouveau bâtiment</label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm"
              placeholder="Ex. Pavillon A, Bâtiment principal…"
              value={buildingLabel}
              onChange={(e) => setBuildingLabel(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await apiPut({ action: "create_building", label: buildingLabel });
                setBuildingLabel("");
              })
            }
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
          >
            Ajouter le bâtiment
          </button>
        </div>
      )}

      {buildings.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucun bâtiment. Commencez par en créer un, puis ajoutez les étages (RDC, 1er, 2e…).
        </p>
      ) : (
        <div className="space-y-5">
          {buildings.map((building) => {
            const floors = sortInternatFloors(building.floors);
            const bRooms = roomsInBuilding(building.id);
            const beds = bRooms.reduce((s, r) => s + r.capacity, 0);

            return (
              <div key={building.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {canManage ? (
                      <input
                        className="font-black text-slate-900 text-lg bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none"
                        defaultValue={building.label}
                        onBlur={(e) => {
                          const next = e.target.value.trim();
                          if (!next || next === building.label) return;
                          void run(() => apiPut({ action: "update_building", buildingId: building.id, label: next }));
                        }}
                      />
                    ) : (
                      <h4 className="font-black text-slate-900 text-lg">{building.label}</h4>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {floors.length} étage(s) · {bRooms.length} chambre(s) · {beds} place(s)
                    </p>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      disabled={busy || bRooms.length > 0}
                      title={bRooms.length > 0 ? "Supprimez d'abord les chambres" : undefined}
                      onClick={() => {
                        if (!confirm(`Supprimer le bâtiment « ${building.label} » ?`)) return;
                        void run(() => apiPut({ action: "delete_building", buildingId: building.id }));
                      }}
                      className="text-xs font-bold text-red-600 hover:underline disabled:opacity-40"
                    >
                      Supprimer le bâtiment
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Étages</p>
                  {floors.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Aucun étage — ajoutez-en ci-dessous.</p>
                  ) : (
                    <ul className="space-y-2">
                      {floors.map((floor) => {
                        const fRooms = roomsOnFloor(building.id, floor.id);
                        return (
                          <li
                            key={floor.id}
                            className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                          >
                            {canManage ? (
                              <input
                                className="flex-1 min-w-[8rem] text-sm font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 outline-none"
                                defaultValue={floor.label}
                                onBlur={(e) => {
                                  const next = e.target.value.trim();
                                  if (!next || next === floor.label) return;
                                  void run(() =>
                                    apiPut({
                                      action: "update_floor",
                                      buildingId: building.id,
                                      floorId: floor.id,
                                      label: next,
                                    }),
                                  );
                                }}
                              />
                            ) : (
                              <span className="flex-1 font-semibold text-slate-800">{floor.label}</span>
                            )}
                            <label className="flex items-center gap-1.5 text-xs text-slate-600">
                              <input
                                type="checkbox"
                                checked={floor.inUse}
                                disabled={!canManage || busy}
                                onChange={(e) =>
                                  void run(() =>
                                    apiPut({
                                      action: "update_floor",
                                      buildingId: building.id,
                                      floorId: floor.id,
                                      inUse: e.target.checked,
                                    }),
                                  )
                                }
                              />
                              Utilisé pour l&apos;hébergement
                            </label>
                            <span className="text-[10px] text-slate-400">
                              {fRooms.length} ch. · ordre {floor.sortOrder + 1}
                            </span>
                            {canManage && (
                              <button
                                type="button"
                                disabled={busy || fRooms.length > 0}
                                onClick={() => {
                                  if (!confirm(`Supprimer l'étage « ${floor.label} » ?`)) return;
                                  void run(() =>
                                    apiPut({
                                      action: "delete_floor",
                                      buildingId: building.id,
                                      floorId: floor.id,
                                    }),
                                  );
                                }}
                                className="text-[10px] font-bold text-red-600 hover:underline disabled:opacity-40"
                              >
                                Suppr.
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {canManage && (
                  <div className="flex flex-wrap gap-2 items-end pt-1">
                    <div className="flex-1 min-w-[10rem]">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Ajouter un étage</label>
                      <input
                        className="w-full border rounded-xl px-3 py-2 text-sm"
                        placeholder="Nom de l'étage"
                        value={floorLabels[building.id] || ""}
                        onChange={(e) =>
                          setFloorLabels((prev) => ({ ...prev, [building.id]: e.target.value }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const label = (floorLabels[building.id] || "").trim();
                          if (!label) throw new Error("Nom de l'étage requis.");
                          await apiPut({ action: "add_floor", buildingId: building.id, label });
                          setFloorLabels((prev) => ({ ...prev, [building.id]: "" }));
                        })
                      }
                      className="bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
                    >
                      Ajouter
                    </button>
                    <div className="flex flex-wrap gap-1">
                      {FLOOR_PRESETS.filter(
                        (preset) => !floors.some((f) => f.label.toLowerCase() === preset.toLowerCase()),
                      ).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void run(() =>
                              apiPut({ action: "add_floor", buildingId: building.id, label: preset }),
                            )
                          }
                          className="text-[10px] font-semibold rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

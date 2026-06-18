"use client";

import { useCallback, useEffect, useState } from "react";
import type { InternatSupervisorShift } from "@/app/lib/internat-types";

export default function InternatSupervisorsPanel({ canManage }: { canManage: boolean }) {
  const [shifts, setShifts] = useState<InternatSupervisorShift[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    date: "",
    supervisorName: "",
    startTime: "18:00",
    endTime: "22:00",
    wing: "" as "" | "garcons" | "filles" | "mixte",
    notes: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/internat/supervisor-shifts", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setShifts(data.shifts || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/internat/supervisor-shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, wing: form.wing || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Création impossible");
      setForm({ date: "", supervisorName: "", startTime: "18:00", endTime: "22:00", wing: "", notes: "" });
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce créneau ?")) return;
    await fetch(`/api/internat/supervisor-shifts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 text-sm text-sky-950">
        <p className="font-bold mb-1">Planning surveillants</p>
        <p>Créneaux de permanence par date, aile et horaire.</p>
      </div>

      {canManage && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 grid sm:grid-cols-2 gap-3">
          <input
            type="date"
            className="border rounded-xl px-3 py-2 text-sm"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <input
            className="border rounded-xl px-3 py-2 text-sm"
            placeholder="Surveillant"
            value={form.supervisorName}
            onChange={(e) => setForm({ ...form, supervisorName: e.target.value })}
          />
          <input
            type="time"
            className="border rounded-xl px-3 py-2 text-sm"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          />
          <input
            type="time"
            className="border rounded-xl px-3 py-2 text-sm"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          />
          <select
            className="border rounded-xl px-3 py-2 text-sm"
            value={form.wing}
            onChange={(e) => setForm({ ...form, wing: e.target.value as typeof form.wing })}
          >
            <option value="">Toutes ailes</option>
            <option value="garcons">Garçons</option>
            <option value="filles">Filles</option>
            <option value="mixte">Mixte</option>
          </select>
          <input
            className="border rounded-xl px-3 py-2 text-sm sm:col-span-2"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button
            type="button"
            disabled={busy}
            onClick={create}
            className="bg-sky-600 text-white px-4 py-2 rounded-xl font-bold text-sm sm:col-span-2 w-fit"
          >
            Ajouter le créneau
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3 font-bold">Date</th>
              <th className="p-3 font-bold">Surveillant</th>
              <th className="p-3 font-bold">Horaires</th>
              <th className="p-3 font-bold">Aile</th>
              {canManage && <th className="p-3 font-bold" />}
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 && (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="p-6 text-center text-slate-500">
                  Aucun créneau planifié.
                </td>
              </tr>
            )}
            {shifts.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="p-3">{s.date}</td>
                <td className="p-3 font-semibold">{s.supervisorName}</td>
                <td className="p-3">
                  {s.startTime} – {s.endTime}
                </td>
                <td className="p-3 text-slate-500">{s.wing || "—"}</td>
                {canManage && (
                  <td className="p-3">
                    <button type="button" className="text-red-600 font-bold text-xs" onClick={() => remove(s.id)}>
                      Supprimer
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

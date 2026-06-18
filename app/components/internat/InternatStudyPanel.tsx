"use client";

import { useCallback, useEffect, useState } from "react";
import type { InternatStudyGroup, InternatStudent } from "@/app/lib/internat-types";
import { studentDisplayName } from "@/app/lib/internat-types";

const WEEKDAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function InternatStudyPanel({
  students,
  canManage,
}: {
  students: InternatStudent[];
  canManage: boolean;
}) {
  const [groups, setGroups] = useState<InternatStudyGroup[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    label: "",
    room: "",
    weekday: 1,
    startTime: "19:00",
    endTime: "20:30",
    supervisorName: "",
    studentIds: {} as Record<string, boolean>,
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/internat/study-groups", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setGroups(data.groups || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    const studentIds = students.filter((s) => s.actif && form.studentIds[s.id]).map((s) => s.id);
    setBusy(true);
    try {
      const res = await fetch("/api/internat/study-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, studentIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Création impossible");
      setForm({
        label: "",
        room: "",
        weekday: 1,
        startTime: "19:00",
        endTime: "20:30",
        supervisorName: "",
        studentIds: {},
      });
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce groupe d'études ?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/internat/study-groups?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Suppression impossible");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const active = students.filter((s) => s.actif);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5 text-sm text-violet-950">
        <p className="font-bold mb-1">Études du soir</p>
        <p>Groupes hebdomadaires : salle, créneau, internes et surveillant référent.</p>
      </div>

      {canManage && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-black text-slate-900">Nouveau groupe</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="Libellé (ex. Étude 3e)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <input
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="Salle"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
            />
            <select
              className="border rounded-xl px-3 py-2 text-sm"
              value={form.weekday}
              onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}
            >
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
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
          </div>
          <div className="max-h-40 overflow-y-auto border rounded-xl p-3 text-sm space-y-1">
            {active.map((s) => (
              <label key={s.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.studentIds[s.id]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      studentIds: { ...f.studentIds, [s.id]: e.target.checked },
                    }))
                  }
                />
                {studentDisplayName(s)} — {s.classe}
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={create}
            className="bg-violet-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
          >
            Créer le groupe
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3 font-bold">Groupe</th>
              <th className="p-3 font-bold">Créneau</th>
              <th className="p-3 font-bold">Internes</th>
              {canManage && <th className="p-3 font-bold" />}
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={canManage ? 4 : 3} className="p-6 text-center text-slate-500">
                  Aucun groupe d&apos;études.
                </td>
              </tr>
            )}
            {groups.map((g) => (
              <tr key={g.id} className="border-t border-slate-100 align-top">
                <td className="p-3">
                  <p className="font-semibold">{g.label}</p>
                  <p className="text-xs text-slate-500">{g.room || "Salle —"} · {g.supervisorName || "—"}</p>
                </td>
                <td className="p-3 whitespace-nowrap">
                  {WEEKDAYS[g.weekday]} {g.startTime}–{g.endTime}
                </td>
                <td className="p-3 text-xs">{g.studentIds.length} interne(s)</td>
                {canManage && (
                  <td className="p-3">
                    <button type="button" className="text-red-600 font-bold text-xs" onClick={() => remove(g.id)}>
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

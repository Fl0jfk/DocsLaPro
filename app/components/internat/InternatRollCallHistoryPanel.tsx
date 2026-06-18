"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InternatStudent } from "@/app/lib/internat-types";

type HistoryRow = {
  date: string;
  period: "matin" | "soir";
  studentId: string;
  studentName: string;
  classe?: string;
  mark: string;
  markLabel: string;
  validatedBy?: string;
};

const MARK_TONE: Record<string, string> = {
  present: "text-emerald-700",
  absent: "text-red-700",
  excuse: "text-amber-700",
  activite: "text-sky-700",
};

export default function InternatRollCallHistoryPanel() {
  const [students, setStudents] = useState<InternatStudent[]>([]);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    studentId: "",
    period: "" as "" | "matin" | "soir",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.studentId) params.set("studentId", filters.studentId);
      if (filters.period) params.set("period", filters.period);
      const res = await fetch(`/api/internat/roll-call/history?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chargement impossible");
      setRows(data.history || []);
      setStudents(data.students || []);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, HistoryRow[]>();
    for (const row of rows) {
      const key = `${row.date}|${row.period}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h3 className="font-black text-slate-900">Historique des présences</h3>
        <p className="text-sm text-slate-500">
          Consultation des appels validés (matin et soir) enregistrés sur S3.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="date"
            className="border rounded-xl px-3 py-2 text-sm"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            placeholder="Du"
          />
          <input
            type="date"
            className="border rounded-xl px-3 py-2 text-sm"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          />
          <select
            className="border rounded-xl px-3 py-2 text-sm"
            value={filters.studentId}
            onChange={(e) => setFilters((f) => ({ ...f, studentId: e.target.value }))}
          >
            <option value="">Tous les internes</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.eleveRef.prenom} {s.eleveRef.nom} — {s.classe}
              </option>
            ))}
          </select>
          <select
            className="border rounded-xl px-3 py-2 text-sm"
            value={filters.period}
            onChange={(e) =>
              setFilters((f) => ({ ...f, period: e.target.value as "" | "matin" | "soir" }))
            }
          >
            <option value="">Matin + soir</option>
            <option value="matin">Appel matin</option>
            <option value="soir">Appel soir</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun appel validé pour ces critères.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([key, dayRows]) => {
            const [date, period] = key.split("|");
            return (
              <section key={key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <header className="bg-slate-50 px-4 py-3 flex flex-wrap justify-between gap-2">
                  <p className="font-bold text-slate-900">
                    {date} — appel {period}
                  </p>
                  <p className="text-xs text-slate-500">{dayRows.length} marquage(s)</p>
                </header>
                <table className="w-full text-sm">
                  <tbody>
                    {dayRows.map((r) => (
                      <tr key={`${r.studentId}-${r.mark}`} className="border-t border-slate-100">
                        <td className="p-3 font-medium">{r.studentName}</td>
                        <td className="p-3 text-slate-500">{r.classe}</td>
                        <td className={`p-3 font-bold ${MARK_TONE[r.mark] || ""}`}>{r.markLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

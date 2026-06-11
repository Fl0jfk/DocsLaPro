"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PERSONNEL_LEAVE_STATUS_LABELS,
  PERSONNEL_LEAVE_TYPE_LABELS,
  type PersonnelIndexEntry,
  type PersonnelLeaveRequest,
  type PersonnelLeaveType,
} from "@/app/lib/personnel-types";

export default function RhLeavePanel({
  canManage,
  index,
}: {
  canManage: boolean;
  index: PersonnelIndexEntry[];
}) {
  const [requests, setRequests] = useState<PersonnelLeaveRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    personnelId: "",
    type: "conge_paye" as PersonnelLeaveType,
    startDate: "",
    endDate: "",
    reason: "",
  });

  const load = async () => {
    const res = await fetch("/api/personnel/leaves", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setRequests(data.requests || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!form.personnelId || !form.startDate) return alert("Collaborateur et date requis.");
    setBusy(true);
    try {
      const res = await fetch("/api/personnel/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...form, endDate: form.endDate || form.startDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Création impossible");
      setForm({ personnelId: "", type: "conge_paye", startDate: "", endDate: "", reason: "" });
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const decide = async (id: string, approved: boolean) => {
    const note = approved ? "" : prompt("Motif du refus (optionnel) :") || "";
    setBusy(true);
    try {
      const res = await fetch("/api/personnel/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decide", id, approved, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Décision impossible");
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        Demandes de congés pour le personnel OGEC — validation RH par e-mail au collaborateur.
        Les absences du jour restent visibles dans le module <Link href="/absences" className="text-indigo-600 font-bold underline">Absences</Link>.
      </div>

      {canManage && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="font-black text-slate-900">Nouvelle demande (pour un collaborateur)</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <select
              className="border rounded-xl px-3 py-2 text-sm sm:col-span-2"
              value={form.personnelId}
              onChange={(e) => setForm({ ...form, personnelId: e.target.value })}
            >
              <option value="">Collaborateur —</option>
              {index.filter((p) => p.active).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
            <select
              className="border rounded-xl px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as PersonnelLeaveType })}
            >
              {Object.entries(PERSONNEL_LEAVE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="border rounded-xl px-3 py-2 text-sm"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <input
              type="date"
              className="border rounded-xl px-3 py-2 text-sm"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              placeholder="Fin"
            />
            <input
              className="border rounded-xl px-3 py-2 text-sm sm:col-span-2"
              placeholder="Motif (optionnel)"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={create}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
          >
            Enregistrer la demande
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3 font-bold">Collaborateur</th>
              <th className="p-3 font-bold">Type</th>
              <th className="p-3 font-bold">Période</th>
              <th className="p-3 font-bold">Statut</th>
              {canManage && <th className="p-3 font-bold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="p-6 text-center text-slate-500">
                  Aucune demande.
                </td>
              </tr>
            )}
            {requests.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3 font-semibold">
                  <Link href={`/rh/${r.personnelId}`} className="text-indigo-600 hover:underline">
                    {r.personnelName}
                  </Link>
                </td>
                <td className="p-3">{PERSONNEL_LEAVE_TYPE_LABELS[r.type]}</td>
                <td className="p-3 whitespace-nowrap">
                  {r.startDate}
                  {r.endDate !== r.startDate ? ` → ${r.endDate}` : ""}
                </td>
                <td className="p-3">{PERSONNEL_LEAVE_STATUS_LABELS[r.status]}</td>
                {canManage && (
                  <td className="p-3">
                    {r.status === "en_attente" && (
                      <div className="flex gap-2">
                        <button type="button" className="text-xs font-bold text-emerald-700" onClick={() => decide(r.id, true)}>
                          Valider
                        </button>
                        <button type="button" className="text-xs font-bold text-red-600" onClick={() => decide(r.id, false)}>
                          Refuser
                        </button>
                      </div>
                    )}
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

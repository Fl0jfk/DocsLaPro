"use client";

import { useEffect, useState } from "react";
import {
  PERSONNEL_LEAVE_STATUS_LABELS,
  PERSONNEL_LEAVE_TYPE_LABELS,
  type PersonnelLeaveRequest,
  type PersonnelLeaveType,
} from "@/app/lib/personnel-types";

export default function RhMyLeavesPanel({ personnelId }: { personnelId: string }) {
  const [requests, setRequests] = useState<PersonnelLeaveRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
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

  const submit = async () => {
    if (!form.startDate) return alert("Indiquez au moins une date de début.");
    setBusy(true);
    try {
      const res = await fetch("/api/personnel/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          personnelId,
          ...form,
          endDate: form.endDate || form.startDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Envoi impossible");
      setForm({ type: "conge_paye", startDate: "", endDate: "", reason: "" });
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    if (!confirm("Annuler cette demande ?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/personnel/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Annulation impossible");
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <div>
        <h2 className="font-black text-slate-900">Mes congés & absences</h2>
        <p className="text-xs text-slate-500 mt-1">
          Déposez une demande — la RH vous répond par e-mail. Pas de gestion des soldes CP ici (logiciel paie).
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
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
          placeholder="Date de fin"
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
        onClick={submit}
        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
      >
        Envoyer la demande
      </button>

      {requests.length > 0 && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100 pt-3 space-y-0">
          {requests.map((r) => (
            <li key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <span className="font-bold text-slate-900">{PERSONNEL_LEAVE_TYPE_LABELS[r.type]}</span>
                <span className="text-slate-500 ml-2">
                  {r.startDate}
                  {r.endDate !== r.startDate ? ` → ${r.endDate}` : ""}
                </span>
                <span
                  className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                    r.status === "validee"
                      ? "bg-emerald-100 text-emerald-800"
                      : r.status === "refusee"
                        ? "bg-rose-100 text-rose-800"
                        : r.status === "annulee"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {PERSONNEL_LEAVE_STATUS_LABELS[r.status]}
                </span>
              </div>
              {r.status === "en_attente" && (
                <button
                  type="button"
                  className="text-xs font-bold text-slate-500 underline"
                  disabled={busy}
                  onClick={() => cancel(r.id)}
                >
                  Annuler
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

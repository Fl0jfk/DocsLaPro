"use client";

import { useCallback, useEffect, useState } from "react";
import type { InternatIncident, InternatIncidentKind, InternatStudent } from "@/app/lib/internat-types";
import { studentDisplayName } from "@/app/lib/internat-types";

const KIND_LABELS: Record<InternatIncidentKind, string> = {
  incident: "Incident",
  remarque: "Remarque",
  sanction: "Sanction",
  valorisation: "Valorisation",
};

const KIND_TONE: Record<InternatIncidentKind, string> = {
  incident: "bg-red-100 text-red-900",
  remarque: "bg-amber-100 text-amber-900",
  sanction: "bg-slate-200 text-slate-800",
  valorisation: "bg-emerald-100 text-emerald-900",
};

export default function InternatEducationalPanel({
  students,
  canManage,
}: {
  students: InternatStudent[];
  canManage: boolean;
}) {
  const [incidents, setIncidents] = useState<InternatIncident[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    kind: "remarque" as InternatIncidentKind,
    title: "",
    description: "",
    occurredAt: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/internat/incidents", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setIncidents(data.incidents || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/internat/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Enregistrement impossible");
      setForm({
        studentId: "",
        kind: "remarque",
        title: "",
        description: "",
        occurredAt: new Date().toISOString().slice(0, 10),
      });
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette entrée ?")) return;
    await fetch(`/api/internat/incidents?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  };

  const active = students.filter((s) => s.actif);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5 text-sm text-orange-950">
        <p className="font-bold mb-1">Suivi éducatif</p>
        <p>Incidents, remarques, sanctions et valorisations par interne.</p>
      </div>

      {canManage && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="font-black text-slate-900">Nouvelle entrée</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <select
              className="border rounded-xl px-3 py-2 text-sm"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            >
              <option value="">Interne *</option>
              {active.map((s) => (
                <option key={s.id} value={s.id}>
                  {studentDisplayName(s)} — {s.classe}
                </option>
              ))}
            </select>
            <select
              className="border rounded-xl px-3 py-2 text-sm"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as InternatIncidentKind })}
            >
              {(Object.keys(KIND_LABELS) as InternatIncidentKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="border rounded-xl px-3 py-2 text-sm"
              value={form.occurredAt}
              onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
            />
            <input
              className="border rounded-xl px-3 py-2 text-sm sm:col-span-2"
              placeholder="Titre *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className="border rounded-xl px-3 py-2 text-sm sm:col-span-2 min-h-[80px]"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={create}
            className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
          >
            Enregistrer
          </button>
        </div>
      )}

      <div className="space-y-3">
        {incidents.length === 0 && <p className="text-sm text-slate-500">Aucune entrée de suivi.</p>}
        {incidents.map((i) => (
          <article key={i.id} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${KIND_TONE[i.kind]}`}>
                  {KIND_LABELS[i.kind]}
                </span>
                <h4 className="font-bold text-slate-900 mt-2">{i.title}</h4>
                <p className="text-sm text-slate-600">
                  {i.studentName} · {i.occurredAt}
                </p>
                {i.description && <p className="text-sm text-slate-500 mt-2">{i.description}</p>}
                <p className="text-xs text-slate-400 mt-2">
                  Par {i.createdBy.name} — {new Date(i.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
              {canManage && (
                <button type="button" className="text-xs text-red-600 font-bold" onClick={() => remove(i.id)}>
                  Supprimer
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

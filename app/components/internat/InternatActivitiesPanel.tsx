"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InternatActivity } from "@/app/lib/internat-types";

type PlanningOuting = {
  id: string;
  title: string;
  activity: string;
  outingDate: string;
  departureTime?: string;
  returnTime?: string;
  status: string;
  participantCount: number;
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function InternatActivitiesPanel() {
  const [activities, setActivities] = useState<InternatActivity[]>([]);
  const [outings, setOutings] = useState<PlanningOuting[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => monthKey(new Date()));

  const load = useCallback(async () => {
    const [year, month] = viewMonth.split("-").map(Number);
    const from = `${viewMonth}-01`;
    const to = `${viewMonth}-${String(daysInMonth(year, month - 1)).padStart(2, "0")}`;
    const res = await fetch(`/api/internat/planning?from=${from}&to=${to}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) {
      setActivities(data.activities || []);
      setOutings(data.outings || []);
    }
  }, [viewMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, { activities: InternatActivity[]; outings: PlanningOuting[] }>();
    for (const a of activities) {
      const bucket = map.get(a.date) || { activities: [], outings: [] };
      bucket.activities.push(a);
      map.set(a.date, bucket);
    }
    for (const o of outings) {
      const bucket = map.get(o.outingDate) || { activities: [], outings: [] };
      bucket.outings.push(o);
      map.set(o.outingDate, bucket);
    }
    return map;
  }, [activities, outings]);

  const create = async () => {
    if (!title.trim() || !date) return alert("Titre et date requis.");
    setBusy(true);
    try {
      const res = await fetch("/api/internat/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setTitle("");
      setDescription("");
      setDate("");
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cet événement ?")) return;
    await fetch("/api/internat/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    await load();
  };

  const [year, month] = viewMonth.split("-").map(Number);
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const totalDays = daysInMonth(year, month - 1);
  const firstDow = new Date(year, month - 1, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setViewMonth(monthKey(d));
  };

  const upcoming = useMemo(() => {
    const items: Array<{ date: string; kind: "activity" | "outing"; label: string; detail?: string }> = [];
    for (const a of activities) {
      items.push({ date: a.date, kind: "activity", label: a.title, detail: a.description });
    }
    for (const o of outings) {
      items.push({
        date: o.outingDate,
        kind: "outing",
        label: o.title,
        detail: `${o.participantCount} interne(s)`,
      });
    }
    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [activities, outings]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-indigo-950">
        Calendrier des <strong>événements internat</strong> et des <strong>sorties autorisées / en cours</strong> —
        sans messagerie staff.
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => shiftMonth(-1)} className="text-sm font-bold text-slate-600">
            ←
          </button>
          <h3 className="font-black text-slate-900 capitalize">{monthLabel}</h3>
          <button type="button" onClick={() => shiftMonth(1)} className="text-sm font-bold text-slate-600">
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-slate-400">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const key = `${viewMonth}-${String(day).padStart(2, "0")}`;
            const events = eventsByDate.get(key);
            const hasActivity = (events?.activities.length || 0) > 0;
            const hasOuting = (events?.outings.length || 0) > 0;
            return (
              <div
                key={key}
                className={`min-h-[3.25rem] rounded-lg border p-1 text-xs ${
                  hasActivity || hasOuting ? "border-indigo-200 bg-indigo-50/40" : "border-slate-100"
                }`}
              >
                <span className="font-bold text-slate-700">{day}</span>
                <div className="flex gap-0.5 mt-0.5">
                  {hasActivity && <span className="h-1.5 w-1.5 rounded-full bg-violet-500" title="Événement" />}
                  {hasOuting && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Sortie" />}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-500 mr-1" />
          Événement
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 ml-3 mr-1" />
          Sortie
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h3 className="font-black text-slate-900">Planifier un événement</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input type="date" className="border rounded-xl px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
          <textarea className="border rounded-xl px-3 py-2 text-sm sm:col-span-2" placeholder="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <button type="button" disabled={busy} onClick={create} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm">
          Ajouter
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-black text-slate-900 mb-3">Ce mois-ci</h3>
        <ul className="space-y-2 text-sm">
          {upcoming.map((item) => (
            <li key={`${item.kind}-${item.date}-${item.label}`} className="flex gap-3 items-start border-b border-slate-50 pb-2">
              <span className="text-xs text-slate-500 w-24 shrink-0">
                {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${item.kind === "outing" ? "bg-emerald-100 text-emerald-800" : "bg-violet-100 text-violet-800"}`}>
                {item.kind === "outing" ? "Sortie" : "Événement"}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{item.label}</p>
                {item.detail && <p className="text-xs text-slate-500">{item.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
        {upcoming.length === 0 && <p className="text-slate-500 text-sm">Rien de prévu ce mois-ci.</p>}
      </div>

      <ul className="space-y-2">
        {activities.map((a) => (
          <li key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">{a.title}</p>
              <p className="text-xs text-slate-500">{new Date(a.date).toLocaleDateString("fr-FR")}</p>
              {a.description && <p className="text-sm text-slate-600 mt-1">{a.description}</p>}
            </div>
            <button type="button" onClick={() => remove(a.id)} className="text-xs text-red-600 font-bold h-fit">
              Suppr.
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

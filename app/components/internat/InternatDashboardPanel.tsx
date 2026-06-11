"use client";

import type { InternatDashboardStats } from "@/app/lib/internat-stats";

export default function InternatDashboardPanel({ stats }: { stats: InternatDashboardStats | null }) {
  if (!stats) {
    return <p className="text-slate-500 text-sm">Chargement des indicateurs…</p>;
  }

  const tonightLabel =
    stats.tonightRollCall.status === "validee"
      ? "Validé"
      : stats.tonightRollCall.status === "en_cours"
        ? "En cours"
        : "Non démarré";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Internes actifs" value={String(stats.activeStudents)} />
        <StatCard label="Chambres" value={String(stats.roomCount)} />
        <StatCard
          label="Taux présence 7 j"
          value={stats.presenceRate7d != null ? `${stats.presenceRate7d} %` : "—"}
        />
        <StatCard label="Appel ce soir" value={tonightLabel} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-black text-slate-900 mb-3">Ce soir</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>Présents : {stats.tonightRollCall.presentCount}</li>
            <li>Activité ext. : {stats.tonightRollCall.activityCount}</li>
            <li>Absents : {stats.tonightRollCall.absentCount}</li>
            <li>Excusés : {stats.tonightRollCall.excusedCount}</li>
            <li>Section garçons : {stats.tonightRollCall.boysComplete ? "complète" : "en attente"}</li>
            <li>Section filles : {stats.tonightRollCall.girlsComplete ? "complète" : "en attente"}</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-black text-slate-900 mb-3">Chambres</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>{stats.roomsWithFreeSlots} chambre(s) avec place libre</li>
            <li>{stats.roomsOverCapacity.length} chambre(s) en surbooking</li>
          </ul>
          {stats.roomsOverCapacity.length > 0 && (
            <ul className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-1">
              {stats.roomsOverCapacity.map((r) => (
                <li key={r.roomId}>
                  {r.label} : {r.count}/{r.capacity}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {stats.lastValidatedRollCall && (
        <p className="text-xs text-slate-500">
          Dernier appel validé : {stats.lastValidatedRollCall.date}
          {stats.lastValidatedRollCall.validatedBy ? ` par ${stats.lastValidatedRollCall.validatedBy}` : ""}
        </p>
      )}

      {stats.weeklySummary && (
        <section className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <h3 className="font-black text-indigo-900 mb-2">Synthèse hebdomadaire</h3>
          <pre className="text-sm text-indigo-900/90 whitespace-pre-wrap font-sans">{stats.weeklySummary}</pre>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}

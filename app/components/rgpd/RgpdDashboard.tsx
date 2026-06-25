"use client";

import type { RgpdComplianceScore } from "@/app/lib/rgpd-types";
import type { RgpdActionItem, RgpdDocumentWithMeta } from "@/app/lib/rgpd-scoring";

export default function RgpdDashboard({
  score,
  actions,
  documents,
}: {
  score: RgpdComplianceScore;
  actions: RgpdActionItem[];
  documents: RgpdDocumentWithMeta[];
}) {
  const missing = documents.filter(
    (d) => d.requirement.applicable && d.state.status === "manquant",
  ).length;
  const ok = documents.filter(
    (d) =>
      d.requirement.applicable &&
      (d.state.status === "genere" || d.state.status === "importe" || d.state.status === "valide"),
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-6 text-center">
          <p className="text-5xl font-black text-indigo-700">{score.total}</p>
          <p className="text-sm text-slate-600 mt-1">Score de conformité / 100</p>
        </div>
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm font-bold text-slate-800 mb-2">Détail du score</p>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>Documents obligatoires : {score.mandatoryDocs} / 55</li>
            <li>Documents recommandés : {score.recommendedDocs} / 20</li>
            <li>Questionnaire : {score.questionnaire} / 10</li>
            <li>Qualité IA : {score.quality} / 15</li>
          </ul>
        </div>
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm font-bold text-slate-800 mb-2">Documents applicables</p>
          <p className="text-2xl font-bold text-emerald-700">{ok}</p>
          <p className="text-xs text-slate-500">présents · {missing} manquant(s)</p>
        </div>
      </div>

      {actions.length > 0 && (
        <div className="rounded-2xl border bg-white p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Actions prioritaires</h3>
          <ul className="space-y-2">
            {actions.slice(0, 8).map((a) => (
              <li
                key={a.docId}
                className={`text-sm rounded-lg px-3 py-2 border ${
                  a.priority === "haute"
                    ? "bg-red-50 border-red-100 text-red-900"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <strong>{a.title}</strong> — {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

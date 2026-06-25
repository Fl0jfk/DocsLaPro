"use client";

import { useCallback, useEffect, useState } from "react";
import ReplayModuleTourButton from "@/app/components/module-tour/ReplayModuleTourButton";
import RgpdDashboard from "@/app/components/rgpd/RgpdDashboard";
import RgpdDisclaimer from "@/app/components/rgpd/RgpdDisclaimer";
import RgpdDocumentsPanel from "@/app/components/rgpd/RgpdDocumentsPanel";
import RgpdIncidentsPanel from "@/app/components/rgpd/RgpdIncidentsPanel";
import RgpdQuestionnaireWizard from "@/app/components/rgpd/RgpdQuestionnaireWizard";
import type { RgpdDocumentContentPreview } from "@/app/lib/rgpd-types";
import type { RgpdActionItem, RgpdDocumentWithMeta } from "@/app/lib/rgpd-scoring";
import type { RgpdComplianceScore, RgpdQuestionnaireAnswers, RgpdWorkspace } from "@/app/lib/rgpd-types";
import { DEFAULT_RGPD_ANSWERS } from "@/app/lib/rgpd-types";

type Tab = "dashboard" | "questionnaire" | "documents" | "incidents";

export default function ConformiteRgpdPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<RgpdQuestionnaireAnswers>(DEFAULT_RGPD_ANSWERS);
  const [score, setScore] = useState<RgpdComplianceScore | null>(null);
  const [documents, setDocuments] = useState<RgpdDocumentWithMeta[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<RgpdDocumentContentPreview[]>([]);
  const [actions, setActions] = useState<RgpdActionItem[]>([]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/rgpd/workspace");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setAnswers(data.workspace?.answers ?? DEFAULT_RGPD_ANSWERS);
    setScore(data.score);
    setDocuments(data.documents ?? []);
    setDocumentPreviews(data.documentPreviews ?? []);
    setActions(data.actions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveAnswers = async (patch: Partial<RgpdQuestionnaireAnswers>, complete?: boolean) => {
    setSaving(true);
    try {
      const res = await fetch("/api/rgpd/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: patch,
          markQuestionnaireComplete: complete,
          note: complete ? "Questionnaire terminé" : "Étape questionnaire",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnswers(data.workspace?.answers ?? answers);
      setScore(data.score);
      setDocuments(data.documents ?? []);
      setDocumentPreviews(data.documentPreviews ?? []);
      setActions(data.actions ?? []);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Tableau de bord" },
    { id: "questionnaire", label: "Questionnaire" },
    { id: "documents", label: "Documents" },
    { id: "incidents", label: "Incidents" },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">Chargement du module RGPD…</div>
    );
  }

  return (
    <div
      className={`mx-auto px-4 py-8 space-y-6 ${
        tab === "documents" ? "max-w-7xl" : "max-w-5xl"
      }`}
      data-tour="rgpd-module"
    >
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-slate-900">Conformité RGPD</h1>
          <ReplayModuleTourButton moduleId="conformite-rgpd" />
        </div>
        <p className="text-sm text-slate-600">
          Questionnaire, documents types, score de conformité et gestion des incidents pour votre
          établissement scolaire.
        </p>
        <RgpdDisclaimer />
      </header>

      <nav className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-bold rounded-t-xl ${
              tab === t.id
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "dashboard" && score && (
        <RgpdDashboard score={score} actions={actions} documents={documents} />
      )}

      {tab === "questionnaire" && (
        <RgpdQuestionnaireWizard
          answers={answers}
          onChange={(patch) => setAnswers((prev) => ({ ...prev, ...patch }))}
          onSave={saveAnswers}
          saving={saving}
        />
      )}

      {tab === "documents" && (
        <RgpdDocumentsPanel
          documents={documents}
          documentPreviews={documentPreviews}
          onRefresh={refresh}
        />
      )}

      {tab === "incidents" && <RgpdIncidentsPanel />}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AcademicDeadlinesPayload } from "@/app/lib/academic-deadlines";
import type { AcademicDeadlineCategory } from "@/app/lib/academic-deadlines";

type Props = {
  open: boolean;
  onDone: (payload: AcademicDeadlinesPayload) => void;
  onError: (message: string | null) => void;
  onClose: () => void;
};

type Tab = "text" | "pdf" | "manual";

const CATEGORIES: { value: AcademicDeadlineCategory; label: string }[] = [
  { value: "mutation_intra", label: "Mutation intra" },
  { value: "mutation_inter", label: "Mutation inter" },
  { value: "examens", label: "Examens" },
  { value: "parcoursup", label: "Parcoursup" },
  { value: "affectation", label: "Affectation élèves" },
  { value: "rentree", label: "Rentrée" },
  { value: "autre", label: "Autre" },
];

const EMPTY_MANUAL = {
  title: "",
  detail: "",
  date: "",
  endDate: "",
  category: "autre" as AcademicDeadlineCategory,
  platform: "",
  sourceUrl: "",
  sourceLabel: "",
};

export default function AcademicDeadlineImportModal({ open, onDone, onError, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("text");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [manual, setManual] = useState(EMPTY_MANUAL);
  const [lastAdded, setLastAdded] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setLastAdded(null);
      setText("");
      setSourceLabel("");
      setSourceUrl("");
      setManual(EMPTY_MANUAL);
      setTab("text");
    }
  }, [open]);

  if (!open || !mounted) return null;

  const analyzeText = async () => {
    setBusy(true);
    onError(null);
    setLastAdded(null);
    try {
      const res = await fetch("/api/dashboard/academic-deadlines/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sourceLabel, sourceUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Analyse impossible.");
      if (json.payload) {
        onDone(json.payload);
        setLastAdded(json.added ?? 0);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setBusy(false);
    }
  };

  const importPdf = async (file: File) => {
    setBusy(true);
    onError(null);
    setLastAdded(null);
    try {
      const prep = await fetch("/api/dashboard/academic-deadlines/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });
      const prepJson = await prep.json();
      if (!prep.ok) throw new Error(prepJson.error || "Préparation upload impossible.");

      const put = await fetch(prepJson.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!put.ok) throw new Error("Envoi du PDF échoué.");

      const imp = await fetch("/api/dashboard/academic-deadlines/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: prepJson.key,
          fileName: file.name,
          sourceLabel: sourceLabel || file.name,
          sourceUrl,
        }),
      });
      const impJson = await imp.json();
      if (!imp.ok) throw new Error(impJson.error || "Analyse impossible.");

      if (impJson.payload) {
        onDone(impJson.payload);
        setLastAdded(impJson.added ?? 0);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    onError(null);
    try {
      const res = await fetch("/api/dashboard/academic-deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manual,
          kind: manual.endDate ? "ongoing" : "deadline",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ajout impossible.");
      if (json.payload) {
        onDone(json.payload);
        setLastAdded(1);
        setManual(EMPTY_MANUAL);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setBusy(false);
    }
  };

  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
        tab === id
          ? "bg-[var(--dash-primary)] text-white"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {label}
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/25 backdrop-blur-[3px]"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        className="relative z-[1] flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[color:var(--dash-border)] bg-white shadow-2xl shadow-slate-900/15"
        role="dialog"
        aria-modal="true"
        aria-labelledby="academic-import-title"
      >
        <div className="shrink-0 border-b border-stone-100 p-5 pb-4">
          <h2 id="academic-import-title" className="text-base font-black text-stone-800">
            Charger des échéances académiques
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Collez un texte, importez un PDF ou saisissez une date — l&apos;IA extrait les échéances clés.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tabBtn("text", "Texte / copier-coller")}
            {tabBtn("pdf", "PDF")}
            {tabBtn("manual", "Une échéance")}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-4">
          {(tab === "text" || tab === "pdf") && (
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                  Libellé source
                </span>
                <input
                  value={sourceLabel}
                  onChange={(e) => setSourceLabel(e.target.value)}
                  placeholder="Circulaire rectorat mars 2026"
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[var(--dash-primary)]"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                  Lien source (page web, mail…)
                </span>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://www.ac-normandie.fr/…"
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[var(--dash-primary)]"
                />
              </label>
            </div>
          )}

          {tab === "text" ? (
            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                  Texte à analyser *
                </span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  placeholder="Collez ici le contenu d'une circulaire, d'un mail rectorat, d'une page ac-normandie.fr…"
                  className="mt-1 w-full resize-y rounded-lg border border-stone-200 px-3 py-2 text-sm leading-relaxed outline-none focus:border-[var(--dash-primary)]"
                />
              </label>
              <button
                type="button"
                disabled={busy || text.trim().length < 40}
                onClick={() => void analyzeText()}
                className="w-full rounded-lg bg-[var(--dash-primary)] py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50"
              >
                {busy ? "Analyse en cours…" : "Extraire les dates clés (IA)"}
              </button>
            </div>
          ) : null}

          {tab === "pdf" ? (
            <div className="space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importPdf(f);
                }}
              />
              <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-stone-600">Circulaire ou calendrier PDF</p>
                <p className="mt-1 text-xs text-stone-400">OCR + extraction des échéances (30–90 s)</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="mt-4 rounded-lg bg-[var(--dash-primary)] px-4 py-2 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50"
                >
                  {busy ? "Analyse…" : "Choisir un PDF"}
                </button>
              </div>
            </div>
          ) : null}

          {tab === "manual" ? (
            <form onSubmit={(e) => void submitManual(e)} className="space-y-3">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Titre *</span>
                <input
                  required
                  value={manual.title}
                  onChange={(e) => setManual((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[var(--dash-primary)]"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Détail</span>
                <input
                  value={manual.detail}
                  onChange={(e) => setManual((f) => ({ ...f, detail: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[var(--dash-primary)]"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Date *</span>
                  <input
                    required
                    type="date"
                    value={manual.date}
                    onChange={(e) => setManual((f) => ({ ...f, date: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[var(--dash-primary)]"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Fin</span>
                  <input
                    type="date"
                    value={manual.endDate}
                    onChange={(e) => setManual((f) => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[var(--dash-primary)]"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Catégorie</span>
                <select
                  value={manual.category}
                  onChange={(e) =>
                    setManual((f) => ({ ...f, category: e.target.value as AcademicDeadlineCategory }))
                  }
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[var(--dash-primary)]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Plateforme</span>
                  <input
                    value={manual.platform}
                    onChange={(e) => setManual((f) => ({ ...f, platform: e.target.value }))}
                    placeholder="Colibris, SIAM…"
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[var(--dash-primary)]"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Lien source</span>
                  <input
                    type="url"
                    value={manual.sourceUrl}
                    onChange={(e) => setManual((f) => ({ ...f, sourceUrl: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[var(--dash-primary)]"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-[var(--dash-primary)] py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50"
              >
                {busy ? "Enregistrement…" : "Ajouter cette échéance"}
              </button>
            </form>
          ) : null}

          {lastAdded !== null && lastAdded > 0 ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-800">
              {lastAdded} échéance{lastAdded > 1 ? "s" : ""} ajoutée{lastAdded > 1 ? "s" : ""} au calendrier.
            </p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-stone-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-stone-200 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

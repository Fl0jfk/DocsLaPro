"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeComptaSheetDerived,
  emptyComptaFacturation,
  emptyComptaSheet,
  formatEuroDisplay,
  isUsableComptaAmount,
  parseEuroAmount,
  type ComptaOcrLogEntry,
  type TravelsComptaFacturation,
  type TravelsComptaIndividualAid,
  type TravelsComptaSheet,
} from "@/app/lib/travels-compta-sheet";
import { TripButton } from "@/app/components/travels/TripDetailUI";

type Props = {
  tripId: string;
  /** Empreinte des documents du dossier — déclenche une resync auto si elle change. */
  documentsRevision?: string;
  /** Affiche le bouton de validation du budget (étape compta). */
  canValidateBudget?: boolean;
  /** Budget déjà validé et transmis. */
  budgetValidated?: boolean;
  /** Panneau intégré (défaut) ou contenu de modale */
  variant?: "inline" | "modal";
  onSaved?: (sheet: TravelsComptaSheet) => void;
  onValidateBudget?: (sheet: TravelsComptaSheet) => void | Promise<void>;
};

function euroInput(value: number | null, onChange: (v: number | null) => void, className = "") {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value == null ? "" : formatEuroDisplay(value)}
      onChange={(e) => onChange(parseEuroAmount(e.target.value))}
      className={`w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-mono text-right ${className}`}
      placeholder="0,00"
    />
  );
}

export default function TravelsComptaSheetForm({
  tripId,
  documentsRevision = "",
  canValidateBudget = false,
  budgetValidated = false,
  variant = "inline",
  onSaved,
  onValidateBudget,
}: Props) {
  const [sheet, setSheet] = useState<TravelsComptaSheet>(emptyComptaSheet());
  const [initialLoading, setInitialLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [ocrInfo, setOcrInfo] = useState<string | null>(null);
  const [ocrDebugLog, setOcrDebugLog] = useState<ComptaOcrLogEntry[]>([]);
  const [showOcrLog, setShowOcrLog] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [validating, setValidating] = useState(false);

  const hydrated = useRef(false);
  const skipSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSavedRef = useRef(onSaved);
  const onValidateBudgetRef = useRef(onValidateBudget);
  const loadSeq = useRef(0);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  useEffect(() => {
    onValidateBudgetRef.current = onValidateBudget;
  }, [onValidateBudget]);

  const derived = useMemo(() => computeComptaSheetDerived(sheet), [sheet]);
  const busLine = sheet.depenses.find((d) => d.source === "devis_signe");
  const showOcrPanel =
    Boolean(busLine) &&
    (ocrDebugLog.length > 0 || analyzing || !isUsableComptaAmount(busLine?.amount));

  const patch = useCallback((partial: Partial<TravelsComptaSheet>) => {
    setSheet((prev) => computeComptaSheetDerived({ ...prev, ...partial }));
  }, []);

  const persistSheet = useCallback(async (finalSheet: TravelsComptaSheet) => {
    setSaveState("saving");
    setError(null);
    try {
      const res = await fetch("/api/travels/compta-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, action: "save", sheet: finalSheet }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setSaveState("saved");
      onSavedRef.current?.(data.sheet || finalSheet);
    } catch (e) {
      setSaveState("error");
      setError(e instanceof Error ? e.message : "Erreur d'enregistrement");
    }
  }, [tripId]);

  const loadSheet = useCallback(async () => {
    const seq = ++loadSeq.current;
    setError(null);
    try {
      const resFast = await fetch(
        `/api/travels/compta-sheet?tripId=${encodeURIComponent(tripId)}&skipSync=1`,
        { cache: "no-store" },
      );
      const dataFast = await resFast.json();
      if (!resFast.ok) throw new Error(dataFast?.error || "Erreur");
      if (seq !== loadSeq.current) return;

      skipSave.current = true;
      const fastSheet = computeComptaSheetDerived(dataFast.sheet || emptyComptaSheet());
      setSheet(fastSheet);
      hydrated.current = true;
      setOcrDebugLog(
        Array.isArray(dataFast.debugLog) ? dataFast.debugLog : fastSheet.ocrDebugLog || [],
      );
      setInitialLoading(false);

      if (!dataFast.needSync) {
        setOcrInfo(
          dataFast.sheet?.analysisNotes
            ? String(dataFast.sheet.analysisNotes)
            : "Fiche à jour avec les documents du dossier.",
        );
        return;
      }

      setAnalyzing(true);
      setOcrInfo("Nouveau document détecté — analyse OCR en cours…");

      const resSync = await fetch(`/api/travels/compta-sheet?tripId=${encodeURIComponent(tripId)}`, {
        cache: "no-store",
      });
      const dataSync = await resSync.json();
      if (!resSync.ok) throw new Error(dataSync?.error || "Erreur");
      if (seq !== loadSeq.current) return;

      skipSave.current = true;
      const nextSheet = computeComptaSheetDerived(dataSync.sheet || emptyComptaSheet());
      setSheet(nextSheet);
      setOcrDebugLog(
        Array.isArray(dataSync.debugLog) ? dataSync.debugLog : nextSheet.ocrDebugLog || [],
      );

      const parts: string[] = [];
      if (dataSync.ocrNewCount > 0) parts.push(`${dataSync.ocrNewCount} document(s) analysé(s)`);
      if (dataSync.removedCount > 0) parts.push(`${dataSync.removedCount} document(s) retiré(s)`);
      if (dataSync.syncNotes) parts.push(String(dataSync.syncNotes));
      setOcrInfo(parts.join(" · ") || "Dossier synchronisé avec les documents.");
    } catch (e) {
      if (seq === loadSeq.current) setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      if (seq === loadSeq.current) {
        setAnalyzing(false);
        setInitialLoading(false);
      }
    }
  }, [tripId]);

  async function handleForceBusOcr() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/travels/compta-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, action: "analyze", forceBusOcr: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      skipSave.current = true;
      const nextSheet = computeComptaSheetDerived(data.sheet || emptyComptaSheet());
      setSheet(nextSheet);
      setOcrDebugLog(Array.isArray(data.debugLog) ? data.debugLog : nextSheet.ocrDebugLog || []);
      setShowOcrLog(true);
      setOcrInfo(data.syncNotes || "Analyse OCR relancée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de relancer l'OCR.");
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    hydrated.current = false;
    skipSave.current = true;
    setInitialLoading(true);
    void loadSheet();

    return () => {
      loadSeq.current += 1;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [tripId, documentsRevision, loadSheet]);

  useEffect(() => {
    if (!hydrated.current || initialLoading || analyzing) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistSheet(computeComptaSheetDerived(sheet));
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [sheet, initialLoading, analyzing, persistSheet]);

  async function handleValidateBudget() {
    const finalSheet = computeComptaSheetDerived(sheet);
    setValidating(true);
    setError(null);
    try {
      skipSave.current = true;
      await persistSheet(finalSheet);
      await onValidateBudgetRef.current?.(finalSheet);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de valider le budget.");
    } finally {
      setValidating(false);
    }
  }

  async function downloadPdf() {
    setPdfBusy(true);
    setError(null);
    try {
      const finalSheet = computeComptaSheetDerived(sheet);
      const res = await fetch("/api/travels/compta-sheet/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, sheet: finalSheet }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      const href = String(data.pdf || "");
      if (!href) throw new Error("PDF vide.");
      const link = document.createElement("a");
      link.href = href;
      link.download = String(data.filename || "Fiche_Compta.pdf");
      link.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de générer le PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  function updateDepense(index: number, field: "label" | "amount", value: string | number | null) {
    const depenses = sheet.depenses.map((line, i) =>
      i === index ? { ...line, [field]: field === "amount" ? (value as number | null) : String(value) } : line,
    );
    patch({ depenses });
  }

  function addDepense() {
    patch({ depenses: [...sheet.depenses, { label: "", amount: null }] });
  }

  function updateAide(index: number, field: keyof TravelsComptaIndividualAid, value: string | number | null) {
    const aidesIndividuelles = sheet.aidesIndividuelles.map((row, i) =>
      i === index
        ? { ...row, [field]: field === "amount" ? (value as number | null) : String(value) }
        : row,
    );
    patch({ aidesIndividuelles });
  }

  function addAide() {
    patch({ aidesIndividuelles: [...sheet.aidesIndividuelles, { name: "", amount: null }] });
  }

  function updateFacturation(
    index: number,
    field: keyof TravelsComptaFacturation,
    value: string | number | null,
  ) {
    const facturations = sheet.facturations.map((row, i) =>
      i === index
        ? {
            ...row,
            [field]:
              field === "montant" || field === "prixFacture"
                ? (value as number | null)
                : String(value),
          }
        : row,
    );
    patch({ facturations });
  }

  function addFacturation() {
    patch({ facturations: [...sheet.facturations, emptyComptaFacturation()] });
  }

  function removeFacturation(index: number) {
    if (sheet.facturations.length <= 1) return;
    patch({ facturations: sheet.facturations.filter((_, i) => i !== index) });
  }

  const shellClass =
    variant === "inline"
      ? "rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      : "flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl";

  return (
    <div className={shellClass}>
      <div className="border-b border-slate-100 px-5 py-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Comptabilité</p>
          <h2 className="text-lg font-black text-slate-900">Fiche budget voyage</h2>
          <p className="mt-1 text-sm text-slate-500">
            Saisie et synchronisation automatique avec les documents. Le budget définitif n&apos;est transmis à la direction qu&apos;après validation en bas de page.
          </p>
        </div>
        <div className="text-right text-xs font-bold flex flex-col items-end gap-2">
          <TripButton
            variant="dark"
            size="sm"
            onClick={() => void downloadPdf()}
            disabled={initialLoading || analyzing || pdfBusy}
          >
            {pdfBusy ? "PDF…" : "Télécharger en PDF"}
          </TripButton>
          {analyzing && <span className="text-indigo-600">Synchronisation des documents…</span>}
          {!analyzing && saveState === "saving" && <span className="text-slate-500">Enregistrement…</span>}
          {!analyzing && saveState === "saved" && <span className="text-emerald-600">Enregistré</span>}
          {!analyzing && saveState === "error" && <span className="text-red-600">Erreur</span>}
        </div>
      </div>

      <div className={`overflow-y-auto px-5 py-4 space-y-6 ${variant === "modal" ? "flex-1 max-h-[70vh]" : ""}`}>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {ocrInfo && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {ocrInfo}
          </div>
        )}

        {showOcrPanel && (
          <section className="rounded-xl border border-slate-300 bg-slate-900 text-slate-100 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-700 bg-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                Journal OCR transport
              </p>
              <div className="flex items-center gap-2">
                <TripButton
                  variant="dark"
                  size="sm"
                  onClick={() => void handleForceBusOcr()}
                  disabled={initialLoading || analyzing}
                >
                  {analyzing ? "OCR en cours…" : "Relancer l'OCR bus"}
                </TripButton>
                <button
                  type="button"
                  onClick={() => setShowOcrLog((v) => !v)}
                  className="text-xs font-bold text-slate-300 hover:text-white px-2 py-1"
                >
                  {showOcrLog ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>
            {showOcrLog && (
              <div className="max-h-64 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-1.5">
                {analyzing && ocrDebugLog.length === 0 && (
                  <p className="text-slate-400">Analyse OCR en cours…</p>
                )}
                {ocrDebugLog.map((entry, i) => (
                  <div key={`${entry.at}-${i}`} className="border-b border-slate-800 pb-1.5 last:border-0">
                    <span
                      className={
                        entry.level === "error"
                          ? "text-red-400"
                          : entry.level === "warn"
                            ? "text-amber-400"
                            : "text-emerald-400"
                      }
                    >
                      [{entry.level.toUpperCase()}]
                    </span>{" "}
                    <span className="text-slate-500">
                      {new Date(entry.at).toLocaleTimeString("fr-FR")}
                    </span>{" "}
                    <span className="text-slate-100">{entry.message}</span>
                    {entry.detail ? (
                      <pre className="mt-0.5 whitespace-pre-wrap break-all text-slate-400 text-[10px]">
                        {entry.detail}
                      </pre>
                    ) : null}
                  </div>
                ))}
                {!analyzing && ocrDebugLog.length === 0 && (
                  <p className="text-slate-400">
                    Aucun log pour l&apos;instant — cliquez sur « Relancer l&apos;OCR bus ».
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {initialLoading ? (
          <p className="text-center text-slate-500 py-8">Chargement et synchronisation des documents…</p>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(
                [
                  ["compte", "Compte"],
                  ["ligne", "Ligne"],
                  ["classe", "Classe"],
                  ["profs", "Profs"],
                  ["accompagnateurs", "Accompagnateurs"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                  <input
                    value={sheet[key]}
                    onChange={(e) => patch({ [key]: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              ))}
            </section>

            <section className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500">
                Dépenses
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                    <th className="p-3 font-bold">Libellé</th>
                    <th className="p-3 font-bold w-36">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.depenses.map((line, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="p-2">
                        <input
                          value={line.label}
                          onChange={(e) => updateDepense(i, "label", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                          placeholder="Ex. Transport bus"
                        />
                      </td>
                      <td className="p-2">{euroInput(line.amount, (v) => updateDepense(i, "amount", v))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-3">
                      Total dépenses
                      <span className="block text-[10px] font-normal text-slate-400 normal-case">
                        {budgetValidated ? "Budget total final validé" : "Devient le budget total final à la validation"}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">
                      {derived.depensesTotal != null ? `${formatEuroDisplay(derived.depensesTotal)} €` : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <button type="button" onClick={addDepense} className="m-3 text-xs font-bold text-indigo-600">
                + Ligne de dépense
              </button>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-slate-200 p-4 bg-slate-50/60">
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nb élèves (joindre une liste)
                </span>
                <input
                  type="number"
                  min={0}
                  value={sheet.nbEleves ?? ""}
                  onChange={(e) => patch({ nbEleves: parseEuroAmount(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Prix par élève
                </span>
                <div className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-right">
                  {derived.prixParEleve != null ? `${formatEuroDisplay(derived.prixParEleve)} €` : "—"}
                </div>
                <p className="text-[10px] text-slate-400">Total dépenses ÷ nombre d&apos;élèves</p>
              </label>
            </section>

            <section className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-indigo-50 px-4 py-3 flex justify-between items-center border-b border-indigo-100">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-800">Recettes</p>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Total recettes + subventions
                  </p>
                  <p className="font-mono font-black text-indigo-900">
                    {derived.totalRecettes != null ? `${formatEuroDisplay(derived.totalRecettes)} €` : "—"}
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2 border-b border-slate-100">
                <div className="flex justify-between text-sm">
                  <span>
                    Recettes élèves
                    <span className="block text-[10px] font-normal text-slate-500 normal-case">
                      Somme des montants de facturation
                    </span>
                  </span>
                  <span className="font-mono font-bold">
                    {derived.recettesEleves != null ? `${formatEuroDisplay(derived.recettesEleves)} €` : "—"}
                  </span>
                </div>
                {(derived.totalSubventions ?? 0) > 0 ? (
                  <div className="flex justify-between text-sm text-emerald-800">
                    <span>
                      Subventions (APEL + autres)
                      <span className="block text-[10px] font-normal text-slate-500 normal-case">
                        Ajoutées au total recettes, déduites du prix par élève
                      </span>
                    </span>
                    <span className="font-mono font-bold">
                      + {formatEuroDisplay(derived.totalSubventions ?? 0)} €
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm font-bold text-indigo-800">
                  <span>
                    Prix par élève définitif
                    <span className="block text-[10px] font-normal text-slate-500 normal-case">
                      {(derived.totalSubventions ?? 0) > 0
                        ? "(Total dépenses − subventions) ÷ nb élèves"
                        : budgetValidated
                          ? "Validé et transmis"
                          : "Validé uniquement après le bouton en bas de page"}
                    </span>
                  </span>
                  <span className="font-mono">
                    {derived.prixParEleveAvecSubventions != null
                      ? `${formatEuroDisplay(derived.prixParEleveAvecSubventions)} €`
                      : "#DIV/0!"}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                Facturations
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                    <th className="p-3 font-bold">Libellé</th>
                    <th className="p-3 font-bold w-36">Date</th>
                    <th className="p-3 font-bold w-32">Montant</th>
                    <th className="p-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {sheet.facturations.map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 align-top">
                      <td className="p-2">
                        {i === 0 ? (
                          <div className="space-y-2">
                            <input
                              value={row.label ?? ""}
                              onChange={(e) => updateFacturation(i, "label", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                              placeholder="Transport"
                            />
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs">
                              <span className="text-slate-500">Prix facture (devis bus) : </span>
                              <span className="font-mono font-bold">
                                {derived.facturations[i]?.prixFacture != null
                                  ? `${formatEuroDisplay(derived.facturations[i].prixFacture!)} €`
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <input
                            value={row.label ?? ""}
                            onChange={(e) => updateFacturation(i, "label", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                            placeholder="Ex. Activité, hébergement…"
                          />
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          type="date"
                          value={row.dateFacturation}
                          onChange={(e) => updateFacturation(i, "dateFacturation", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="p-2">
                        {euroInput(row.montant, (v) => updateFacturation(i, "montant", v))}
                      </td>
                      <td className="p-2">
                        {sheet.facturations.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeFacturation(i)}
                            className="text-xs font-bold text-red-500 hover:text-red-700"
                            title="Supprimer"
                          >
                            ×
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={addFacturation} className="m-3 text-xs font-bold text-indigo-600">
                + Ligne de facturation
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    APEL — aides collectives
                  </span>
                  {euroInput(sheet.apelAidesCollectives, (v) => patch({ apelAidesCollectives: v }))}
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Autres subventions
                  </span>
                  {euroInput(sheet.autresSubventions, (v) => patch({ autresSubventions: v }))}
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-dashed border-slate-300 overflow-hidden bg-slate-50/40">
              <div className="bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500">
                APEL — aides individuelles
                <span className="ml-2 font-normal normal-case text-slate-400">
                  (hors calcul global — rattachées à certains élèves)
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                    <th className="p-3 font-bold">Nom — Prénom</th>
                    <th className="p-3 font-bold w-36">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.aidesIndividuelles.map((row, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="p-2">
                        <input
                          value={row.name}
                          onChange={(e) => updateAide(i, "name", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="p-2">{euroInput(row.amount, (v) => updateAide(i, "amount", v))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-600">
                    <td className="p-3">Total aides individuelles (informatif)</td>
                    <td className="p-3 text-right font-mono">
                      {derived.totalAidesIndividuelles != null
                        ? `${formatEuroDisplay(derived.totalAidesIndividuelles)} €`
                        : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <button type="button" onClick={addAide} className="m-3 text-xs font-bold text-indigo-600">
                + Aide individuelle
              </button>
            </section>

            <div
              className={`rounded-xl border px-4 py-3 flex justify-between items-center font-black ${
                derived.excedentOuDeficit == null
                  ? "border-slate-200 bg-slate-50 text-slate-700"
                  : derived.excedentOuDeficit >= 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              <div>
                <span>Excédent ou déficit</span>
                <span className="block text-[10px] font-normal normal-case mt-0.5 opacity-80">
                  Total recettes + subventions − total dépenses
                </span>
              </div>
              <span className="font-mono text-lg">
                {derived.excedentOuDeficit != null ? `${formatEuroDisplay(derived.excedentOuDeficit)} €` : "—"}
              </span>
            </div>

            {(canValidateBudget || budgetValidated) && (
              <section className="rounded-xl border-2 border-indigo-300 bg-indigo-50/60 p-5 space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-700">
                    Validation comptabilité
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Vérifiez la fiche puis validez pour figer le budget et transmettre le dossier à la direction.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white border border-indigo-100 px-4 py-3">
                    <p className="text-xs text-slate-500">Budget total final</p>
                    <p className="font-mono font-black text-lg text-slate-900">
                      {derived.depensesTotal != null ? `${formatEuroDisplay(derived.depensesTotal)} €` : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border border-indigo-100 px-4 py-3">
                    <p className="text-xs text-slate-500">Prix par élève définitif</p>
                    <p className="font-mono font-black text-lg text-slate-900">
                      {derived.prixParEleveAvecSubventions != null
                        ? `${formatEuroDisplay(derived.prixParEleveAvecSubventions)} €`
                        : "—"}
                    </p>
                  </div>
                </div>
                {canValidateBudget ? (
                  <TripButton
                    variant="primary"
                    onClick={() => void handleValidateBudget()}
                    disabled={initialLoading || analyzing || validating || pdfBusy}
                  >
                    {validating ? "Validation…" : "Valider le budget et transmettre à la direction"}
                  </TripButton>
                ) : (
                  <p className="text-sm font-semibold text-emerald-800">
                    Budget validé — dossier en attente de validation finale par la direction.
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

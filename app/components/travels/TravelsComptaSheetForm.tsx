"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeComptaSheetDerived,
  emptyComptaSheet,
  formatEuroDisplay,
  parseEuroAmount,
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
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/travels/compta-sheet?tripId=${encodeURIComponent(tripId)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      if (seq !== loadSeq.current) return;
      skipSave.current = true;
      const nextSheet = computeComptaSheetDerived(data.sheet || emptyComptaSheet());
      setSheet(nextSheet);
      hydrated.current = true;

      if (data.synced) {
        const parts: string[] = [];
        if (data.ocrNewCount > 0) {
          parts.push(`${data.ocrNewCount} document(s) analysé(s)`);
        }
        if (data.removedCount > 0) {
          parts.push(`${data.removedCount} document(s) retiré(s)`);
        }
        if (data.syncNotes) parts.push(String(data.syncNotes));
        setOcrInfo(parts.join(" · ") || "Dossier synchronisé avec les documents.");
      } else if (data.sheet?.analysisNotes) {
        setOcrInfo(String(data.sheet.analysisNotes));
      } else {
        setOcrInfo("Fiche à jour avec les documents du dossier.");
      }
    } catch (e) {
      if (seq === loadSeq.current) setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      if (seq === loadSeq.current) {
        setAnalyzing(false);
        setInitialLoading(false);
      }
    }
  }, [tripId]);

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

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Prix par élève (recettes)
                </span>
                {euroInput(sheet.prixParEleve, (v) => patch({ prixParEleve: v }))}
              </label>
            </section>

            <section className="rounded-xl border border-slate-200 p-4 space-y-2 bg-indigo-50/40">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Recettes</p>
              <div className="flex justify-between text-sm">
                <span>Recettes élèves</span>
                <span className="font-mono font-bold">
                  {derived.recettesEleves != null ? `${formatEuroDisplay(derived.recettesEleves)} €` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-indigo-800">
                <span>
                  Prix par élève définitif
                  <span className="block text-[10px] font-normal text-slate-500 normal-case">
                    {budgetValidated ? "Validé et transmis" : "Validé uniquement après le bouton en bas de page"}
                  </span>
                </span>
                <span className="font-mono">
                  {derived.prixParEleveAvecSubventions != null
                    ? `${formatEuroDisplay(derived.prixParEleveAvecSubventions)} €`
                    : "#DIV/0!"}
                </span>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500">
                Facturation transport
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-500">Prix facture</span>
                  {euroInput(sheet.facturation.prixFacture, (v) =>
                    patch({ facturation: { ...sheet.facturation, prixFacture: v } }),
                  )}
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-500">Date de facturation</span>
                  <input
                    type="date"
                    value={sheet.facturation.dateFacturation}
                    onChange={(e) =>
                      patch({ facturation: { ...sheet.facturation, dateFacturation: e.target.value } })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-500">Montant facturation</span>
                  {euroInput(sheet.facturation.montant, (v) =>
                    patch({ facturation: { ...sheet.facturation, montant: v } }),
                  )}
                </label>
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </section>

            <section className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500">
                APEL — aides individuelles
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
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-3">Total recettes + subventions</td>
                    <td className="p-3 text-right font-mono">
                      {derived.totalRecettes != null ? `${formatEuroDisplay(derived.totalRecettes)} €` : "—"}
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
                (derived.excedentOuDeficit ?? 0) >= 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              <span>Excédent ou déficit</span>
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

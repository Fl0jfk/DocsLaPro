"use client";

import { useCallback, useEffect, useState } from "react";
import { TripButton } from "@/app/components/travels/TripDetailUI";
import { formatEuroDisplay } from "@/app/lib/travels-compta-sheet";
import type { TravelsComptaSheet } from "@/app/lib/travels-compta-sheet";
import type { ComptaApelSummary } from "@/app/lib/travels-compta-apel-summary";

type Props = {
  tripId: string;
  open: boolean;
  onClose: () => void;
  summary: ComptaApelSummary | null;
  loading: boolean;
  onRefresh: () => void;
  currentSheet: TravelsComptaSheet;
};

export default function TravelsComptaApelSummaryModal({
  tripId,
  open,
  onClose,
  summary,
  loading,
  onRefresh,
  currentSheet,
}: Props) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) onRefresh();
  }, [open, onRefresh]);

  const downloadPdf = useCallback(async () => {
    setPdfBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/travels/compta-apel-summary/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, currentSheet }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      const href = String(data.pdf || "");
      if (!href) throw new Error("PDF vide.");
      const link = document.createElement("a");
      link.href = href;
      link.download = String(data.filename || "Recap_APEL.pdf");
      link.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de générer le PDF.");
    } finally {
      setPdfBusy(false);
    }
  }, [tripId, currentSheet]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-800">APEL</p>
            <h3 className="text-lg font-black text-slate-900">Total général à facturer à l&apos;APEL</h3>
            <p className="mt-1 text-sm text-slate-600">
              Année scolaire {summary?.schoolYear.label ?? "…"} — du 1<sup>er</sup> septembre au 15 juillet.
              <span className="block text-xs text-slate-500 mt-0.5">
                Aide collective du voyage + aides individuelles, cumulées sur tous les voyages de l&apos;année.
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white hover:text-slate-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {loading ? (
            <p className="text-center text-slate-500 py-8">Chargement du récapitulatif…</p>
          ) : summary ? (
            <>
              {summary.currentTrip ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 flex justify-between items-center gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Ce voyage</p>
                    <p className="font-semibold text-slate-900">{summary.currentTrip.title}</p>
                    <p className="text-xs text-slate-500">{summary.currentTrip.travelDateLabel}</p>
                  </div>
                  <p className="font-mono font-black text-lg text-emerald-900 whitespace-nowrap">
                    {formatEuroDisplay(summary.currentTrip.totalApel)} €
                  </p>
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs text-slate-500">
                      <th className="p-3 font-bold">Voyage</th>
                      <th className="p-3 font-bold">Date</th>
                      <th className="p-3 font-bold text-right">Collectif</th>
                      <th className="p-3 font-bold text-right">Individ.</th>
                      <th className="p-3 font-bold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.trips.length > 0 ? (
                      summary.trips.map((row) => (
                        <tr
                          key={row.tripId}
                          className={`border-b border-slate-50 ${
                            row.tripId === summary.currentTripId ? "bg-emerald-50/40" : ""
                          }`}
                        >
                          <td className="p-3 text-slate-800">{row.title}</td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">{row.travelDateLabel}</td>
                          <td className="p-3 font-mono text-right whitespace-nowrap">
                            {row.apelCollective > 0 ? `${formatEuroDisplay(row.apelCollective)} €` : "—"}
                          </td>
                          <td className="p-3 font-mono text-right whitespace-nowrap">
                            {row.aidesIndividuelles > 0 ? `${formatEuroDisplay(row.aidesIndividuelles)} €` : "—"}
                          </td>
                          <td className="p-3 font-mono text-right font-semibold whitespace-nowrap">
                            {row.totalApel > 0 ? `${formatEuroDisplay(row.totalApel)} €` : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                          Aucun engagement APEL renseigné sur les voyages de cette année scolaire.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-50 font-bold text-emerald-950">
                      <td className="p-3" colSpan={2}>
                        Total année scolaire
                      </td>
                      <td className="p-3 font-mono text-right whitespace-nowrap">
                        {formatEuroDisplay(summary.totals.apelCollective)} €
                      </td>
                      <td className="p-3 font-mono text-right whitespace-nowrap">
                        {formatEuroDisplay(summary.totals.aidesIndividuelles)} €
                      </td>
                      <td className="p-3 font-mono text-right whitespace-nowrap">
                        {formatEuroDisplay(summary.totals.totalApel)} €
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <p className="text-center text-slate-500 py-8">Récapitulatif indisponible.</p>
          )}
        </div>

        <div className="border-t border-slate-100 px-5 py-3 flex flex-wrap justify-end gap-2 bg-slate-50">
          <TripButton variant="dark" size="sm" onClick={() => void downloadPdf()} disabled={pdfBusy || loading}>
            {pdfBusy ? "PDF…" : "Télécharger le récap PDF"}
          </TripButton>
          <TripButton variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </TripButton>
        </div>
      </div>
    </div>
  );
}

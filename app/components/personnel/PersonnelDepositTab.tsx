"use client";

import { useState } from "react";
import Link from "next/link";
import PersonnelDropZone from "@/app/components/personnel/PersonnelDropZone";
import { PERSONNEL_DROP_ACCEPT } from "@/app/lib/personnel-upload-client";

type DepositResult = {
  matched: { id: string; displayName: string; email: string };
  extracted: Record<string, string | undefined>;
};

type DepositFailure = {
  error: string;
  extracted?: Record<string, string | undefined>;
  candidates?: Array<{ id: string; displayName: string; email: string }>;
};

export default function PersonnelDepositTab({ onDone }: { onDone?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DepositResult | null>(null);
  const [failure, setFailure] = useState<DepositFailure | null>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    setResult(null);
    setFailure(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/personnel/deposit", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) {
        setFailure({
          error: j.error || "Dépôt impossible",
          extracted: j.extracted,
          candidates: j.candidates,
        });
        return;
      }
      setResult({ matched: j.matched, extracted: j.extracted || {} });
      onDone?.();
    } catch (e) {
      setFailure({ error: e instanceof Error ? e.message : "Erreur réseau" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-black text-slate-900">Déposer un document</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Déposez un PDF ou un fichier Office (Excel, Word). L&apos;IA lit le document, identifie le
          collaborateur et range le fichier dans son dossier S3 — sans choisir la fiche à la main.
        </p>
      </div>

      <PersonnelDropZone
        title={busy ? "Analyse en cours…" : "Glisser-déposer ici"}
        hint="PDF recommandé · Excel et Word acceptés (lecture sans librairie dédiée)"
        disabled={busy}
        accept={PERSONNEL_DROP_ACCEPT}
        onFile={handleFile}
      />

      {busy && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Lecture du document et identification du collaborateur…</p>
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
          <p className="font-black text-emerald-900">Document rangé automatiquement</p>
          <p className="text-sm text-emerald-800">
            Dossier :{" "}
            <Link href={`/rh/${result.matched.id}`} className="font-bold underline">
              {result.matched.displayName}
            </Link>
          </p>
          {(result.extracted.nom || result.extracted.prenom) && (
            <p className="text-xs text-emerald-700">
              Détecté : {result.extracted.prenom} {result.extracted.nom}
              {result.extracted.type_document ? ` · ${result.extracted.type_document}` : ""}
            </p>
          )}
        </div>
      )}

      {failure && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <p className="font-black text-amber-900">{failure.error}</p>
          {failure.extracted && (failure.extracted.nom || failure.extracted.prenom) && (
            <p className="text-xs text-amber-800">
              Lu dans le document : {failure.extracted.prenom} {failure.extracted.nom}
            </p>
          )}
          {failure.candidates && failure.candidates.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-900 mb-2">Candidats possibles :</p>
              <ul className="space-y-1">
                {failure.candidates.map((c) => (
                  <li key={c.id}>
                    <Link href={`/rh/${c.id}`} className="text-sm font-bold text-indigo-700 underline">
                      {c.displayName}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-700 mt-2">
                Vous pouvez aussi glisser le fichier directement sur la fiche dans l&apos;annuaire.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

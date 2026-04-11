"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type IncomingList = {
  scannedAt: string;
  totalPdfs: number;
  latest: { key: string; lastModified: string; size: number } | null;
  groups: Array<{
    messageId: string;
    messageIdShort: string;
    pdfs: Array<{ key: string; lastModified: string; size: number }>;
  }>;
};

type OcrStepPayload = {
  s3Key: string;
  ocrCharCount: number;
  ocrText: string;
  durationMs: number;
  ocrEmpty: boolean;
};

type MatchPayload = {
  s3Key: string | null;
  timingsMs?: { mistralAndInterpret: number };
  humanSummary?: string;
  blockages?: string[];
  ocrCharCount?: number;
  ocrText?: string;
  mistralKeyPresent?: boolean;
  candidatesCount?: number;
  candidates?: Array<{
    id: string;
    title: string;
    destination: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    classes?: string;
  }>;
  userPromptSentToMistral?: string;
  mistralHttpStatus?: number;
  mistralHttpOk?: boolean;
  mistralResponseKeys?: string[];
  mistralRawAssistantMessage?: string;
  mistralApiBodySnippet?: string;
  jsonParseError?: string | null;
  parsedFromModel?: Record<string, unknown> | null;
  tripIdRaw?: string | null;
  tripIdInCandidateList?: boolean;
  allowedTripIds?: string[];
  finalMatch?: {
    price: string | null;
    company: string | null;
    matchedTripId: string | null;
    matchConfidence: string | null;
    matchMotif: string | null;
    suggestedTripId: string | null;
    matchReviewRequired: boolean;
  };
};

type PipelinePhase = "idle" | "list" | "ocr" | "mistral" | "done" | "error";

export default function DevisIngestDebugPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [watch, setWatch] = useState(true);
  const [incoming, setIncoming] = useState<IncomingList | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [snippet, setSnippet] = useState("");
  const [manualKey, setManualKey] = useState("");

  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [phaseMessage, setPhaseMessage] = useState<string | null>(null);
  const [targetKey, setTargetKey] = useState<string | null>(null);
  const [ocrStep, setOcrStep] = useState<OcrStepPayload | null>(null);
  const [fullResult, setFullResult] = useState<MatchPayload | null>(null);

  const fetchList = useCallback(async () => {
    setListError(null);
    try {
      const res = await fetch("/api/travels/devis-incoming-list");
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error || `HTTP ${res.status}`);
        return;
      }
      setIncoming(data as IncomingList);
    } catch (e) {
      setListError(String(e));
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void fetchList();
  }, [isLoaded, isSignedIn, fetchList]);

  useEffect(() => {
    if (!watch || !isSignedIn) return;
    const t = setInterval(() => void fetchList(), 5000);
    return () => clearInterval(t);
  }, [watch, isSignedIn, fetchList]);

  const runPipeline = async (opts: { useLatest: boolean; s3Key?: string }) => {
    setPhaseMessage(null);
    setOcrStep(null);
    setFullResult(null);
    setTargetKey(null);

    setPhase("list");
    setPhaseMessage("Lecture de la liste S3…");
    await fetchList();

    setPhase("ocr");
    setPhaseMessage("Textract lit le PDF (souvent 20–60 s)…");

    try {
      const ocrRes = await fetch("/api/travels/devis-ingest-diagnostic/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useLatest: opts.useLatest,
          s3Key: opts.s3Key?.trim() || undefined,
        }),
      });
      const ocrData = (await ocrRes.json()) as OcrStepPayload & { error?: string };
      if (!ocrRes.ok) {
        setPhase("error");
        setPhaseMessage(ocrData.error || `OCR HTTP ${ocrRes.status}`);
        return;
      }
      setOcrStep(ocrData);
      setTargetKey(ocrData.s3Key);

      setPhase("mistral");
      setPhaseMessage("Mistral analyse le texte et choisit le voyage…");

      const matchRes = await fetch("/api/travels/devis-ingest-diagnostic/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ocrText: ocrData.ocrText,
          s3Key: ocrData.s3Key,
          subject,
          snippet,
        }),
      });
      const matchData = (await matchRes.json()) as MatchPayload & { error?: string };
      if (!matchRes.ok) {
        setPhase("error");
        setPhaseMessage(matchData.error || `Mistral HTTP ${matchRes.status}`);
        return;
      }
      setFullResult({
        ...matchData,
        ocrCharCount: ocrData.ocrCharCount,
        ocrText: ocrData.ocrText,
      });
      setPhase("done");
      setPhaseMessage(null);
    } catch (e) {
      setPhase("error");
      setPhaseMessage(String(e));
    }
  };

  if (!isLoaded || !isSignedIn) return null;

  const matched = Boolean(fullResult?.finalMatch?.matchedTripId);
  const latest = incoming?.latest;

  return (
    <div className="max-w-5xl mx-auto p-6 min-h-screen mt-[10vh] pb-24">
      <div className="mb-8">
        <Link href="/travels" className="text-sm font-bold text-indigo-600 hover:underline mb-4 inline-block">
          ← Retour aux voyages
        </Link>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suivi devis e-mail → Textract → Mistral</h1>
        <p className="text-slate-600 mt-2 text-sm leading-relaxed max-w-3xl">
          La Lambda Gmail enregistre sous{" "}
          <code className="bg-slate-100 px-1 rounded text-xs">devis-incoming/&lt;id-mail&gt;/…pdf</code>. Cette page
          interroge S3 automatiquement : dès qu’un polling a déposé un PDF, il apparaît ici. Tu peux lancer l’analyse
          sur le <strong>plus récent</strong> sans coller de clé. Les étapes s’affichent dans l’ordre réel (d’abord
          Textract, puis Mistral).
        </p>
        <div className="mt-4 rounded-xl border-2 border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p className="font-bold mb-1">Pourquoi le voyage peut rester vide alors que Mistral est bon ici</p>
          <ul className="list-disc pl-5 space-y-1 text-amber-900/95">
            <li>
              <strong>Cette page ne modifie pas le dossier</strong> : elle lit le PDF et appelle Mistral pour
              l’affichage. Seul <code className="bg-white/70 px-1 rounded text-xs">POST /api/travels/ingest-from-email</code>{" "}
              (appelé par la Lambda après upload S3) écrit dans <code className="bg-white/70 px-1 rounded text-xs">travels/….json</code>{" "}
              → champ <code className="bg-white/70 px-1 rounded text-xs">receivedDevis</code>. Vérifie dans les logs
              Lambda que l’ingest renvoie bien <code className="bg-white/70 px-1 rounded text-xs">matched:true</code> (pas 401 / 503 / timeout).
            </li>
            <li>
              Si l’ingest a bien réussi mais tu ne voyais rien : une <strong>sauvegarde du dossier</strong> avec un onglet
              ouvert d’avant l’e-mail pouvait <strong>réécraser</strong> le JSON sans les nouveaux devis. C’est corrigé
              côté serveur (fusion des <code className="bg-white/70 px-1 rounded text-xs">receivedDevis</code>).
            </li>
          </ul>
        </div>
      </div>

      {/* Live S3 */}
      <section className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-600">Ce que voit S3 maintenant</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={watch} onChange={(e) => setWatch(e.target.checked)} />
              Actualiser toutes les 5 s
            </label>
            <button
              type="button"
              onClick={() => void fetchList()}
              className="text-sm font-bold bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl"
            >
              Actualiser
            </button>
          </div>
        </div>

        {listError && (
          <p className="text-sm text-rose-700 font-medium mb-3">
            {listError}
            <span className="block text-xs font-normal text-rose-600 mt-1">
              Si « Access Denied », ajoute <code className="bg-rose-100 px-1 rounded">s3:ListBucket</code> sur le
              préfixe <code className="bg-rose-100 px-1 rounded">devis-incoming/</code> au rôle utilisé par l’app.
            </span>
          </p>
        )}

        {incoming && (
          <>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div
                className={`rounded-xl p-4 border-2 ${
                  latest ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
                }`}
              >
                <p className="text-xs font-bold text-slate-500 uppercase">PDF le plus récent</p>
                {latest ? (
                  <>
                    <p className="text-xs font-mono break-all mt-1 text-slate-900">{latest.key}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {new Date(latest.lastModified).toLocaleString("fr-FR")} · {(latest.size / 1024).toFixed(1)} Ko
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-amber-900 mt-1">
                    Aucun PDF sous <code className="bg-white/80 px-1 rounded">devis-incoming/</code>. Lance un test
                    Lambda (polling Gmail) puis attends cette liste.
                  </p>
                )}
              </div>
              <div className="rounded-xl p-4 border-2 border-slate-200 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 uppercase">Synthèse</p>
                <p className="text-sm text-slate-800 mt-1">
                  <strong>{incoming.totalPdfs}</strong> PDF au total ·{" "}
                  <strong>{incoming.groups.length}</strong> dossier(s) mail
                </p>
                <p className="text-xs text-slate-500 mt-1">Scan : {new Date(incoming.scannedAt).toLocaleTimeString("fr-FR")}</p>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Dossiers par e-mail (comme la Lambda)</p>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {incoming.groups.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun groupe pour l’instant.</p>
              ) : (
                incoming.groups.map((g) => (
                  <div
                    key={g.messageId}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-mono text-slate-700">mail {g.messageIdShort}</p>
                      <p className="text-xs text-slate-500">{g.pdfs.length} PDF</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {g.pdfs.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          disabled={phase === "ocr" || phase === "mistral"}
                          onClick={() => void runPipeline({ useLatest: false, s3Key: p.key })}
                          className="text-xs font-bold text-indigo-600 hover:underline disabled:opacity-40"
                        >
                          Analyser ce PDF
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </section>

      {/* Actions */}
      <section className="bg-indigo-50 rounded-2xl border-2 border-indigo-200 p-6 mb-6">
        <button
          type="button"
          disabled={phase === "ocr" || phase === "mistral" || !latest}
          onClick={() => void runPipeline({ useLatest: true })}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-2xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
        >
          {phase === "ocr" || phase === "mistral"
            ? "Analyse en cours…"
            : "Analyser le PDF le plus récent (sans coller de clé)"}
        </button>
        {!latest && incoming && (
          <p className="text-xs text-indigo-900 mt-2">Bouton actif dès qu’un PDF apparaît dans la liste ci-dessus.</p>
        )}

        <details className="mt-6">
          <summary className="text-sm font-bold text-indigo-900 cursor-pointer">Objet / extrait du mail (optionnel)</summary>
          <p className="text-xs text-slate-600 mt-2 mb-3">
            La Lambda envoie ça à l’ingest en prod. Ici, pour le diagnostic, c’est optionnel : sans ça, Mistral ne voit
            que l’OCR du PDF.
          </p>
          <input
            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm mb-2 bg-white"
            placeholder="Objet du mail"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm min-h-[72px] bg-white"
            placeholder="Snippet Gmail…"
            value={snippet}
            onChange={(e) => setSnippet(e.target.value)}
          />
        </details>

        <details className="mt-4">
          <summary className="text-sm font-bold text-slate-600 cursor-pointer">Avancé : clé S3 manuelle</summary>
          <input
            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm mt-2 font-mono bg-white"
            placeholder="devis-incoming/…/….pdf"
            value={manualKey}
            onChange={(e) => setManualKey(e.target.value)}
          />
          <button
            type="button"
            disabled={phase === "ocr" || phase === "mistral" || !manualKey.trim()}
            onClick={() => void runPipeline({ useLatest: false, s3Key: manualKey })}
            className="mt-2 text-sm font-bold bg-slate-800 text-white px-4 py-2 rounded-xl disabled:opacity-40"
          >
            Analyser cette clé
          </button>
        </details>
      </section>

      {/* Pipeline timeline */}
      {(phase !== "idle" || phaseMessage) && (
        <section className="rounded-2xl border-2 border-slate-300 bg-white p-6 mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-4">Déroulement</h2>
          <ol className="space-y-3 text-sm">
            <li className={phase === "list" || phase === "ocr" || phase === "mistral" || phase === "done" ? "font-bold text-slate-900" : "text-slate-400"}>
              1. Liste S3 — dossiers mail et PDF détectés
            </li>
            <li className={phase === "ocr" || phase === "mistral" || phase === "done" ? "font-bold text-slate-900" : "text-slate-400"}>
              2. Textract (OCR) sur{" "}
              <span className="font-mono text-xs break-all">{targetKey || "…"}</span>
              {ocrStep && (
                <span className="block text-xs font-normal text-slate-600 mt-1">
                  {ocrStep.ocrCharCount} caractères en {ocrStep.durationMs} ms
                  {ocrStep.ocrEmpty ? " — texte vide, étape suivante sera pauvre." : ""}
                </span>
              )}
            </li>
            <li className={phase === "mistral" || phase === "done" ? "font-bold text-slate-900" : "text-slate-400"}>
              3. Mistral — prix, société, choix du voyage
            </li>
            <li className={phase === "done" ? "font-bold text-emerald-800" : "text-slate-400"}>4. Résultat affiché ci-dessous</li>
          </ol>
          {phaseMessage && (
            <p className="mt-4 text-sm font-medium text-indigo-800 bg-indigo-100/80 rounded-xl px-4 py-3">{phaseMessage}</p>
          )}
          {phase === "error" && (
            <p className="mt-2 text-sm text-rose-700">Corrige le problème indiqué puis relance.</p>
          )}
        </section>
      )}

      {/* Results */}
      {fullResult && phase === "done" && (
        <div className="space-y-8">
          <section
            className={`rounded-2xl border-2 p-5 ${
              matched ? "bg-emerald-50 border-emerald-300" : "bg-amber-50 border-amber-300"
            }`}
          >
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">Résumé</h2>
            <p className="text-base font-semibold text-slate-900 leading-snug">{fullResult.humanSummary}</p>
            {fullResult.timingsMs && (
              <p className="text-xs text-slate-600 mt-2">
                Mistral / interprétation : ~{fullResult.timingsMs.mistralAndInterpret} ms
              </p>
            )}
          </section>

          {fullResult.blockages && fullResult.blockages.length > 0 && (
            <section className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-3">Points notables</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800">
                {fullResult.blockages.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </section>
          )}

          {fullResult.finalMatch && (
            <section className="rounded-2xl border-2 border-slate-200 bg-white p-5">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-3">Décision (comme en prod)</h2>
              <pre className="text-xs font-mono bg-slate-900 text-green-400 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(fullResult.finalMatch, null, 2)}
              </pre>
            </section>
          )}

          <section className="rounded-2xl border-2 border-slate-200 bg-white p-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">Texte OCR</h2>
            <p className="text-xs text-slate-500 mb-2">{fullResult.ocrCharCount ?? 0} caractères</p>
            <pre className="text-xs font-mono bg-slate-100 p-4 rounded-xl max-h-80 overflow-auto whitespace-pre-wrap break-words">
              {fullResult.ocrText || "(vide)"}
            </pre>
          </section>

          <section className="rounded-2xl border-2 border-slate-200 bg-white p-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">Réponse Mistral (brute)</h2>
            <p className="text-xs text-slate-500 mb-2">
              HTTP {fullResult.mistralHttpStatus ?? "?"} · OK : {fullResult.mistralHttpOk ? "oui" : "non"}
            </p>
            <pre className="text-xs font-mono bg-slate-100 p-4 rounded-xl max-h-64 overflow-auto whitespace-pre-wrap break-all">
              {fullResult.mistralRawAssistantMessage || "(vide)"}
            </pre>
            {fullResult.parsedFromModel && (
              <pre className="text-xs font-mono bg-indigo-950 text-indigo-100 p-4 rounded-xl mt-3 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(fullResult.parsedFromModel, null, 2)}
              </pre>
            )}
            <details className="mt-3">
              <summary className="text-xs font-bold text-slate-600 cursor-pointer">Corps API Mistral (extrait)</summary>
              <pre className="text-xs font-mono bg-slate-200 p-3 rounded-lg mt-2 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                {fullResult.mistralApiBodySnippet || "—"}
              </pre>
            </details>
          </section>

          <section className="rounded-2xl border-2 border-slate-200 bg-white p-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">trip_id vs liste candidats</h2>
            <p className="text-sm">
              <strong>trip_id brut :</strong> {fullResult.tripIdRaw ?? "null / vide"}
            </p>
            <p className="text-sm mt-1">
              <strong>Dans la liste :</strong> {fullResult.tripIdInCandidateList ? "oui" : "non"}
            </p>
            <pre className="text-xs font-mono bg-slate-100 p-3 rounded-xl max-h-40 overflow-auto mt-2 whitespace-pre-wrap">
              {(fullResult.allowedTripIds || []).join(", ")}
            </pre>
          </section>

          <details className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5">
            <summary className="text-sm font-bold text-slate-700 cursor-pointer">Prompt envoyé à Mistral</summary>
            <pre className="text-xs font-mono mt-4 p-4 bg-white rounded-xl max-h-96 overflow-auto whitespace-pre-wrap break-words">
              {fullResult.userPromptSentToMistral || "—"}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PersonnelDropZone from "@/app/components/personnel/PersonnelDropZone";
import { PERSONNEL_DROP_ACCEPT } from "@/app/lib/personnel-upload-client";
import type { RhOcrJob } from "@/app/lib/rh/rh-ocr-batch";

export default function RhBulkDepositPanel() {
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<RhOcrJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollJob = useCallback(
    (jobId: string) => {
      stopPoll();
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/rh/deposit/bulk/process?jobId=${encodeURIComponent(jobId)}`, {
            cache: "no-store",
          });
          const j = await res.json();
          if (res.ok && j.job) {
            setJob(j.job);
            if (j.job.status === "completed" || j.job.status === "failed") stopPoll();
          }
        } catch {
          /* ignore */
        }
      }, 2500);
    },
    [stopPoll],
  );

  useEffect(() => () => stopPoll(), [stopPoll]);

  const onFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setBusy(true);
    setError(null);
    setJob(null);
    stopPoll();

    try {
      const fd = new FormData();
      for (const f of list) fd.append("files", f);
      const up = await fetch("/api/rh/deposit/bulk/upload", { method: "POST", body: fd });
      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson.error || "Upload impossible");

      const jobRes = await fetch("/api/rh/deposit/bulk/job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: upJson.items }),
      });
      const jobJson = await jobRes.json();
      if (!jobRes.ok) throw new Error(jobJson.error || "Job impossible");

      setJob(jobJson.job);
      pollJob(jobJson.jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const failed = job?.results.filter((r) => !r.success) ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 shadow-sm">
        <h2 className="font-black text-indigo-950 mb-1">Dépôt RH en vrac (OCR)</h2>
        <p className="text-xs text-indigo-800/90 mb-3">
          Déposez plusieurs PDF : l&apos;IA lit nom/prénom/NIR et range sur le OneDrive RH. Les
          non-identifiés restent dans <strong>Temp/</strong> (comme les dossiers élèves).
        </p>
        <PersonnelDropZone
          title={busy ? "Envoi…" : "Glisser-déposer des PDF"}
          hint="Un ou plusieurs fichiers PDF"
          disabled={busy}
          accept={PERSONNEL_DROP_ACCEPT}
          multiple
          onFiles={(files) => void onFiles(files)}
        />
        {error && (
          <p className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
      </section>

      {job && (
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-black text-slate-900">Traitement OCR</h3>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{job.status}</span>
          </div>
          <p className="text-sm text-slate-600">{job.label}</p>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${job.percent}%` }}
            />
          </div>
          {job.results.length > 0 && (
            <ul className="text-sm space-y-1 max-h-64 overflow-y-auto">
              {job.results.map((r) => (
                <li
                  key={r.fileName}
                  className={r.success ? "text-emerald-700" : "text-amber-800"}
                >
                  {r.success ? "✓" : "○"} {r.fileName}
                  {r.matchedName ? ` → ${r.matchedName}` : ""}
                  {r.error ? ` — ${r.error}` : ""}
                </li>
              ))}
            </ul>
          )}
          {failed.length > 0 && job.status === "completed" && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              {failed.length} fichier(s) non classé(s) : ouvrez OneDrive RH → dossier{" "}
              <strong>Temp</strong> pour les ranger à la main.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import PersonnelDropZone from "@/app/components/personnel/PersonnelDropZone";
import { PERSONNEL_DROP_ACCEPT } from "@/app/lib/personnel-upload-client";

export default function RhSelfDepositPanel() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/rh/deposit/self", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Dépôt impossible");
      setMessage("Document déposé dans votre dossier personnel (OneDrive RH).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm">
      <h2 className="font-black text-emerald-950 mb-1">Déposer un document personnel</h2>
      <p className="text-xs text-emerald-900/80 mb-3">
        Votre identité est reconnue via votre compte — le fichier va dans{" "}
        <strong>votre dossier</strong> sur le OneDrive RH (documents/personnels).
      </p>
      <PersonnelDropZone
        title={busy ? "Envoi…" : "Glisser-déposer ici"}
        hint="PDF · Word · Excel"
        disabled={busy}
        accept={PERSONNEL_DROP_ACCEPT}
        onFile={(f) => void onFile(f)}
      />
      {message && (
        <p className="mt-3 text-sm text-emerald-800 bg-white/70 border border-emerald-100 rounded-xl px-3 py-2">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </section>
  );
}

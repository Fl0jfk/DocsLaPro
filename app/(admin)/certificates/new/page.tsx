"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { currentCertificateSchoolYear } from "@/app/lib/certificates-types";

export default function NewCertificateProgramPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [schoolYear, setSchoolYear] = useState(currentCertificateSchoolYear());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    const t = title.trim();
    if (!t) {
      setError("Titre requis.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/certificates/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, schoolYear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      router.push(`/certificates/${data.program.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-3xl font-black text-slate-900">Nouveau parcours</h1>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="block space-y-1">
          <span className="text-sm font-bold text-slate-700">Titre du certificat / parcours</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Certificat d'excellence sportive"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-bold text-slate-700">Année scolaire</span>
          <input
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={() => void create()}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {busy ? "Création…" : "Créer le parcours"}
        </button>
      </div>
    </div>
  );
}

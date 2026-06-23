"use client";

import { useEffect, useRef, useState } from "react";

type Result = {
  student: { firstName: string; lastName: string; className: string };
  company: {
    name: string;
    siret?: string;
    tutorName?: string;
    tutorEmail?: string;
    tutorPhone?: string;
  };
  warnings: string[];
};

export default function StageDeposerPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingSignatures, setMissingSignatures] = useState<string[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stages/public/deposer", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setTemplateUrl(j.templateUrl || null))
      .catch(() => setTemplateUrl(null));
  }, []);

  async function upload(file: File) {
    setError(null);
    setMissingSignatures([]);
    setMissingFields([]);
    setResult(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/stages/public/deposer", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        if (data.missingSignatures?.length) {
          setMissingSignatures(data.missingSignatures);
        }
        if (data.missingFields?.length) {
          setMissingFields(data.missingFields);
        }
        throw new Error(data.error || "Envoi impossible");
      }

      setResult({
        student: data.student,
        company: data.company,
        warnings: data.warnings || [],
      });
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void upload(file);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-4 py-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-8 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Stages</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Déposer ma convention</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Téléchargez le modèle vierge, remplissez-le et faites-le signer par l&apos;élève, le
            responsable légal et l&apos;organisme d&apos;accueil. Ensuite, déposez le PDF ici — un
            seul clic, sans formulaire.
          </p>
          {templateUrl && (
            <a
              href={templateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-xl bg-white border border-emerald-200 px-5 py-2.5 text-sm font-bold text-emerald-800 shadow-sm hover:bg-emerald-50"
            >
              Télécharger le modèle vierge (PDF)
            </a>
          )}
        </header>

        {result ? (
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm space-y-4">
            <p className="text-lg font-bold text-emerald-800">Convention reçue — merci !</p>
            <p className="text-sm text-slate-700">
              <strong>
                {result.student.firstName} {result.student.lastName}
              </strong>
              {result.student.className ? ` — ${result.student.className}` : ""}
            </p>
            {result.company.name && (
              <div className="text-sm text-slate-600 space-y-1">
                <p>
                  Organisme : <strong>{result.company.name}</strong>
                  {result.company.siret ? ` (SIRET ${result.company.siret})` : ""}
                </p>
                {result.company.tutorName && <p>Tuteur : {result.company.tutorName}</p>}
                {result.company.tutorEmail && <p>E-mail : {result.company.tutorEmail}</p>}
              </div>
            )}
            {result.warnings.length > 0 && (
              <ul className="text-xs text-amber-800 bg-amber-50 rounded-lg p-3 space-y-1">
                {result.warnings.map((w) => (
                  <li key={w}>• {w}</li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-500">
              L&apos;administration va vérifier votre dossier. Le professeur référent et la direction
              recevront ensuite un e-mail pour apposer leur paraphe numérique.
            </p>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white"
            >
              Déposer un autre document
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-5">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-800">
                <p className="font-bold">{error}</p>
                {missingSignatures.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 space-y-0.5">
                    {missingSignatures.map((s) => (
                      <li key={s}>Signature manquante : {s}</li>
                    ))}
                  </ul>
                )}
                {missingFields.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 space-y-0.5">
                    {missingFields.map((f) => (
                      <li key={f}>Champ manquant : {f}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs">
                  Un e-mail de confirmation vous a été envoyé si nous avons votre adresse dans la base
                  élèves.
                </p>
              </div>
            )}

            {busy ? (
              <div className="py-8">
                <p className="text-sm font-bold text-emerald-800 animate-pulse">
                  Lecture du PDF en cours…
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Vérification des signatures et extraction des informations (quelques secondes).
                </p>
              </div>
            ) : (
              <>
                <label className="inline-flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 px-8 py-10 hover:bg-emerald-50 transition-colors w-full">
                  <span className="text-4xl" aria-hidden>
                    📄
                  </span>
                  <span className="text-base font-black text-emerald-900">
                    Choisir ma convention PDF
                  </span>
                  <span className="text-xs text-slate-500">PDF uniquement — max. 15 Mo</span>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    onChange={onFileChange}
                  />
                </label>
                <p className="text-xs text-slate-400">
                  Le document doit être signé par l&apos;élève, le responsable légal et
                  l&apos;organisme d&apos;accueil avant dépôt.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

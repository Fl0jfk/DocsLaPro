"use client";

import { useEffect, useState } from "react";
import RentreePublicHeader from "@/app/components/RentreePublicHeader";
import RhOnboardingPublicForm from "@/app/components/personnel/RhOnboardingPublicForm";

export default function OnboardingRhPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState("Établissement");
  const [loading, setLoading] = useState(true);
  const [usable, setUsable] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/rh/onboarding/public?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Lien invalide");
        setSchoolName(j.schoolName || "Établissement");
        setUsable(!!j.usable);
        setAlreadySubmitted(!!j.alreadySubmitted);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen">
      <RentreePublicHeader />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">RH</p>
          <h1 className="text-3xl font-black text-slate-900 mt-2">Bienvenue — dossier administratif</h1>
          <p className="text-slate-600 mt-3 leading-relaxed">
            Complétez ce formulaire pour votre entrée dans l&apos;établissement. Les informations
            serviront à préparer votre contrat et vos déclarations (URSSAF, dossier personnel).
          </p>
        </div>

        {loading && <p className="text-slate-500">Chargement…</p>}
        {error && (
          <p className="text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">{error}</p>
        )}
        {done && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
            <h2 className="font-black text-lg">Merci !</h2>
            <p className="mt-2 text-sm">
              Votre dossier a été transmis à la direction des ressources humaines. Vous recevrez une
              invitation à activer votre compte intranet lorsque le dossier sera validé.
            </p>
          </div>
        )}
        {!loading && !error && !done && token && (
          <>
            {alreadySubmitted && !usable ? (
              <p className="text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                Ce formulaire a déjà été envoyé et est en cours de traitement par la RH.
              </p>
            ) : (
              <RhOnboardingPublicForm
                token={token}
                schoolName={schoolName}
                disabled={!usable}
                onSuccess={() => setDone(true)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

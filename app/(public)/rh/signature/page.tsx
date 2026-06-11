"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function SignatureContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<{
    employeeName: string;
    signatureLabel: string;
    kind: string;
    status: string;
    startDate?: string;
    endDate?: string;
  } | null>(null);
  const [signerName, setSignerName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Lien invalide.");
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/personnel/signatures/public?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Lien invalide.");
        setView(data);
        if (data.status === "signe") setDone(true);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const sign = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/personnel/signatures/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signerName: signerName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Signature impossible");
      setDone(true);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-center text-sm text-slate-500">Chargement…</p>;
  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
        <h1 className="text-xl font-black text-amber-900">Lien indisponible</h1>
        <p className="text-sm mt-3 text-amber-900/85">{error}</p>
      </div>
    );
  }
  if (!view) return null;

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
        <h1 className="text-xl font-black text-emerald-900">Signature enregistrée</h1>
        <p className="text-sm mt-3 text-emerald-900/85">Merci, votre signature a bien été prise en compte.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-indigo-600 text-white px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">Signature électronique RH</p>
        <h1 className="text-xl font-black mt-1">{view.employeeName}</h1>
      </div>
      <div className="px-6 py-5 space-y-4 text-sm text-slate-700">
        <p>
          <span className="font-bold">Document :</span> {view.signatureLabel}
        </p>
        <p>
          <span className="font-bold">Parcours :</span>{" "}
          {view.kind === "onboarding" ? "Intégration" : "Fin de contrat"}
        </p>
        {view.startDate && (
          <p>
            <span className="font-bold">Date d&apos;entrée :</span> {view.startDate}
          </p>
        )}
        {view.endDate && (
          <p>
            <span className="font-bold">Date de fin :</span> {view.endDate}
          </p>
        )}
        <p className="text-xs text-slate-500 border-t border-slate-100 pt-4 leading-relaxed">
          En cliquant sur « Je signe », vous confirmez avoir pris connaissance du document et valider votre accord.
        </p>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Votre nom</label>
          <input
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Nom et prénom"
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={sign}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          Je signe
        </button>
      </div>
    </div>
  );
}

export default function RhSignaturePage() {
  return (
    <main className="min-h-[60vh] max-w-lg mx-auto px-4 py-16">
      <Suspense fallback={<p className="text-center text-sm text-slate-500">Chargement…</p>}>
        <SignatureContent />
      </Suspense>
    </main>
  );
}

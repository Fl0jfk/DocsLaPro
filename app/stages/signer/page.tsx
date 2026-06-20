"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type SignView = {
  convention: {
    studentName: string;
    className: string;
    companyName: string;
    period: string;
    scheduleSummary: string;
  };
  signature: {
    roleLabel: string;
    label: string;
    status: string;
    signedAt?: string;
    signedBy?: string;
  };
};

function SignerContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [view, setView] = useState<SignView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setError("Lien incomplet.");
      return;
    }
    const res = await fetch(`/api/stages/public/sign?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Lien invalide");
    setView(data);
    if (data.signature?.status === "signe") setDone(true);
  }, [token]);

  useEffect(() => {
    void load().catch((e: unknown) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [load]);

  async function sign() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stages/public/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signerName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setDone(true);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (!view && !error) {
    return <main className="min-h-screen flex items-center justify-center p-6">Chargement…</main>;
  }

  if (error && !view) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-rose-700">{error}</p>
      </main>
    );
  }

  if (!view) return null;

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-[#1F3D2B]">Signature convention de stage</h1>
        <p className="mt-2 text-sm text-stone-600">En tant que : {view.signature.roleLabel}</p>

        <div className="mt-6 rounded-xl bg-stone-50 p-4 text-sm space-y-2">
          <p>
            <strong>Élève :</strong> {view.convention.studentName} ({view.convention.className})
          </p>
          <p>
            <strong>Entreprise :</strong> {view.convention.companyName}
          </p>
          <p>
            <strong>Période :</strong> {view.convention.period}
          </p>
          <p>
            <strong>Horaires :</strong> {view.convention.scheduleSummary}
          </p>
        </div>

        {done ? (
          <p className="mt-6 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            Signature enregistrée
            {view.signature.signedBy ? ` par ${view.signature.signedBy}` : ""}.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            <input
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              placeholder="Votre nom (signature)"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            />
            {error && <p className="text-sm text-rose-700">{error}</p>}
            <button
              type="button"
              disabled={busy}
              onClick={() => void sign()}
              className="w-full rounded-lg bg-[#2F6B4A] py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              Signer la convention
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function StageSignerPage() {
  return (
    <Suspense fallback={<main className="p-8">Chargement…</main>}>
      <SignerContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const LEVELS = ["3e", "2de", "1re", "Tle", "CAP", "BTS"];

type OfferPublic = {
  companyName: string;
  kindLabel: string;
  description: string;
  targetLevels: string[];
  periodStart?: string;
  periodEnd?: string;
  placesLeft: number;
};

function CandidaterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [offer, setOffer] = useState<OfferPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    className: "",
    level: "3e",
    email: "",
    parentEmail: "",
  });

  const load = useCallback(async () => {
    if (!token) {
      setError("Lien incomplet.");
      return;
    }
    const res = await fetch(`/api/stages/public/candidater?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Lien invalide");
    setOffer(data.offer);
    if (data.offer.targetLevels?.[0]) {
      setForm((f) => ({ ...f, level: data.offer.targetLevels[0] }));
    }
  }, [token]);

  useEffect(() => {
    void load().catch((e: unknown) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stages/public/candidater", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      router.push(data.studentLink);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (!offer && !error) {
    return <main className="min-h-screen flex items-center justify-center p-6">Chargement…</main>;
  }

  if (error && !offer) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-rose-700">{error}</p>
      </main>
    );
  }

  if (!offer) return null;

  return (
    <main className="min-h-screen bg-stone-50 py-10 px-4">
      <div className="mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-[#2F6B4A]">Candidature stage</p>
        <h1 className="mt-2 text-2xl font-black text-stone-900">{offer.companyName}</h1>
        <p className="text-sm text-stone-600 mt-1">{offer.kindLabel}</p>
        <p className="mt-4 text-sm text-stone-700">{offer.description}</p>
        <p className="mt-3 text-xs text-stone-500">
          Niveaux : {offer.targetLevels.join(", ")}
          {offer.periodStart && offer.periodEnd ? ` · ${offer.periodStart} → ${offer.periodEnd}` : ""}
        </p>
        <p className="mt-2 text-sm font-semibold text-emerald-800">
          {offer.placesLeft} place{offer.placesLeft > 1 ? "s" : ""} restante{offer.placesLeft > 1 ? "s" : ""}
        </p>

        {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}

        <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              placeholder="Prénom *"
              className="rounded-lg border px-3 py-2 text-sm"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <input
              required
              placeholder="Nom *"
              className="rounded-lg border px-3 py-2 text-sm"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <input
            required
            placeholder="Classe *"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.className}
            onChange={(e) => setForm({ ...form, className: e.target.value })}
          />
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
          >
            {LEVELS.map((lv) => (
              <option key={lv} value={lv}>{lv}</option>
            ))}
          </select>
          <input
            type="email"
            placeholder="E-mail élève (optionnel)"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="email"
            placeholder="E-mail parent (optionnel)"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.parentEmail}
            onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
          />
          <button
            type="submit"
            disabled={busy || offer.placesLeft < 1}
            className="w-full rounded-lg bg-[#2F6B4A] py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Envoi…" : "Candidater et compléter ma préconvention →"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function CandidaterPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center">Chargement…</main>}>
      <CandidaterContent />
    </Suspense>
  );
}

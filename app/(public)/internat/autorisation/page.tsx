"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type DirectionView = {
  kind: "direction";
  outing: {
    title: string;
    activity: string;
    destination?: string;
    accompanists: string;
    dateLabel: string;
    etablissement: string;
    status: string;
    students: { name: string; classe: string }[];
  };
};

type ParentView = {
  kind: "parent";
  outing: {
    title: string;
    activity: string;
    destination?: string;
    accompanists: string;
    dateLabel: string;
    studentName: string;
    classe: string;
    status: string;
  };
};

function AutorisationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<DirectionView | ParentView | null>(null);
  const [signerName, setSignerName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"approved" | "refused" | "authorized" | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Lien invalide.");
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/internat/outings/public?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Lien invalide.");
        setView(data as DirectionView | ParentView);
        if (data.outing?.status === "approved" || data.outing?.status === "authorized") {
          setDone(data.outing.status === "authorized" ? "authorized" : "approved");
        } else if (data.outing?.status === "refused") {
          setDone("refused");
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const respond = async (decision: "approve" | "refuse") => {
    setBusy(true);
    try {
      const res = await fetch("/api/internat/outings/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision, signerName: signerName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Enregistrement impossible");
      setDone(
        data.decision === "authorized"
          ? "authorized"
          : data.decision === "approved"
            ? "approved"
            : "refused",
      );
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-center text-sm text-slate-500">Chargement…</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
        <h1 className="text-xl font-black text-amber-900">Lien indisponible</h1>
        <p className="text-sm text-amber-900/85 mt-3">{error}</p>
      </div>
    );
  }

  if (!view) return null;

  const o = view.outing;

  if (done) {
    const ok = done === "approved" || done === "authorized";
    return (
      <div
        className={`rounded-2xl border px-6 py-8 text-center ${ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
      >
        <h1 className={`text-xl font-black ${ok ? "text-emerald-900" : "text-red-900"}`}>
          {ok ? "Réponse enregistrée" : "Refus enregistré"}
        </h1>
        <p className={`text-sm mt-3 ${ok ? "text-emerald-900/85" : "text-red-900/85"}`}>
          Merci, votre réponse a bien été prise en compte.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-indigo-600 text-white px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">
          {view.kind === "direction" ? "Validation direction" : "Autorisation parentale"}
        </p>
        <h1 className="text-xl font-black mt-1">{o.title}</h1>
      </div>

      <div className="px-6 py-5 space-y-3 text-sm text-slate-700">
        {view.kind === "parent" && (
          <p>
            <span className="font-bold">Élève :</span> {o.studentName} ({o.classe})
          </p>
        )}
        <p>
          <span className="font-bold">Activité :</span> {o.activity}
        </p>
        {o.destination && (
          <p>
            <span className="font-bold">Lieu :</span> {o.destination}
          </p>
        )}
        <p>
          <span className="font-bold">Date :</span> {o.dateLabel}
        </p>
        <p>
          <span className="font-bold">Accompagnement :</span> {o.accompanists}
        </p>

        {view.kind === "direction" && (
          <div className="mt-4">
            <p className="font-bold text-slate-800 mb-2">Élèves concernés ({o.etablissement})</p>
            <ul className="list-disc pl-5 space-y-1">
              {o.students.map((s) => (
                <li key={`${s.name}-${s.classe}`}>
                  {s.name} — {s.classe}
                </li>
              ))}
            </ul>
          </div>
        )}

        {view.kind === "parent" && (
          <p className="text-xs text-slate-500 border-t border-slate-100 pt-4 mt-4 leading-relaxed">
            En cliquant sur « J&apos;autorise », vous confirmez être le représentant légal de cet élève et autoriser sa
            participation à cette sortie.
          </p>
        )}

        <div className="pt-4">
          <label className="block text-xs font-bold text-slate-500 mb-1">Votre nom (optionnel)</label>
          <input
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Nom et prénom"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => respond("approve")}
            className="flex-1 min-w-[8rem] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm disabled:opacity-50"
          >
            {view.kind === "parent" ? "J'autorise" : "Je valide"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => respond("refuse")}
            className="flex-1 min-w-[8rem] bg-white border border-red-200 text-red-700 font-bold py-3 px-4 rounded-xl text-sm disabled:opacity-50"
          >
            Je refuse
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InternatAutorisationPage() {
  return (
    <main className="min-h-[60vh] max-w-lg mx-auto px-4 py-16">
      <Suspense fallback={<p className="text-center text-sm text-slate-500">Chargement…</p>}>
        <AutorisationContent />
      </Suspense>
    </main>
  );
}

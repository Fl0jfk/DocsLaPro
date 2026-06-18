"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { OUTING_STATUS_LABELS } from "@/app/lib/internat-outing";

type TokenView = {
  id: string;
  title: string;
  activity: string;
  destination?: string;
  accompanists: string;
  outingDate: string;
  departureTime?: string;
  returnTime?: string;
  status: keyof typeof OUTING_STATUS_LABELS;
  role: "direction" | "parent";
  etablissement?: string;
  studentName?: string;
  classe?: string;
  decisionStatus: string;
  decidedAt?: string;
  directionApproved?: boolean;
  students?: Array<{ name: string; classe: string }>;
};

function dateLabel(outing: TokenView) {
  const date = new Date(outing.outingDate).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (outing.departureTime && outing.returnTime) {
    return `${date} — départ ${outing.departureTime}, retour ${outing.returnTime}`;
  }
  if (outing.departureTime) return `${date} — départ ${outing.departureTime}`;
  return date;
}

function decisionLabel(status: string) {
  if (status === "approved" || status === "authorized") return "Validé";
  if (status === "refused") return "Refusé";
  return "En attente";
}

function AutorisationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [outing, setOuting] = useState<TokenView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [respondentName, setRespondentName] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setError("Lien incomplet : jeton manquant.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/internat/outings/decision?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Lien invalide");
      setOuting(data.outing);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
      setOuting(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (decision: "approve" | "refuse") => {
    if (!token) return;
    if (decision === "refuse" && !confirm("Confirmer le refus de cette sortie ?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/internat/outings/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          decision,
          respondentName: respondentName.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Enregistrement impossible");
      setOuting(data.outing);
      setDone(true);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const pending =
    outing &&
    (outing.decisionStatus === "pending" ||
      (outing.role === "parent" && outing.directionApproved === false));

  const canRespond =
    outing &&
    outing.decisionStatus === "pending" &&
    (outing.role === "direction" || outing.directionApproved !== false);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-black text-slate-900">Autorisation de sortie — internat</h1>
          <p className="text-sm text-slate-500 mt-2">La Providence</p>
        </header>

        {loading && <p className="text-center text-slate-500 text-sm">Chargement…</p>}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-800">{error}</div>
        )}

        {outing && !error && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase text-indigo-600">
                {outing.role === "direction" ? `Direction — ${outing.etablissement}` : "Réponse parent"}
              </p>
              <h2 className="text-xl font-black text-slate-900 mt-1">{outing.title}</h2>
              <p className="text-sm text-slate-600 mt-1">{outing.activity}</p>
            </div>

            <dl className="text-sm space-y-2 text-slate-700">
              <div>
                <dt className="font-bold text-slate-500 text-xs uppercase">Date</dt>
                <dd>{dateLabel(outing)}</dd>
              </div>
              {outing.destination && (
                <div>
                  <dt className="font-bold text-slate-500 text-xs uppercase">Lieu</dt>
                  <dd>{outing.destination}</dd>
                </div>
              )}
              <div>
                <dt className="font-bold text-slate-500 text-xs uppercase">Accompagnement</dt>
                <dd>{outing.accompanists}</dd>
              </div>
              {outing.role === "direction" && outing.students && (
                <div>
                  <dt className="font-bold text-slate-500 text-xs uppercase">Élèves concernés</dt>
                  <dd>
                    <ul className="mt-1 space-y-1">
                      {outing.students.map((s) => (
                        <li key={s.name + s.classe}>
                          {s.name} — {s.classe}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {outing.role === "parent" && (
                <div>
                  <dt className="font-bold text-slate-500 text-xs uppercase">Élève</dt>
                  <dd>
                    {outing.studentName} — {outing.classe}
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-bold text-slate-500 text-xs uppercase">Votre réponse</dt>
                <dd className="font-semibold">{decisionLabel(outing.decisionStatus)}</dd>
                {outing.decidedAt && (
                  <dd className="text-xs text-slate-500 mt-0.5">
                    {new Date(outing.decidedAt).toLocaleString("fr-FR")}
                  </dd>
                )}
              </div>
              <div>
                <dt className="font-bold text-slate-500 text-xs uppercase">Statut global</dt>
                <dd>{OUTING_STATUS_LABELS[outing.status]}</dd>
              </div>
            </dl>

            {outing.role === "parent" && outing.directionApproved === false && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3">
                La direction n&apos;a pas encore validé cette sortie. Vous pourrez répondre une fois la validation
                direction effectuée.
              </p>
            )}

            {canRespond && !done && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <input
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  placeholder="Votre nom (facultatif)"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                />
                <textarea
                  className="w-full border rounded-xl px-3 py-2 text-sm min-h-[72px]"
                  placeholder="Commentaire (facultatif)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => submit("approve")}
                    className="flex-1 min-w-[120px] bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-sm"
                  >
                    {outing.role === "direction" ? "Valider la sortie" : "J'autorise"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => submit("refuse")}
                    className="flex-1 min-w-[120px] bg-white border border-red-200 text-red-700 px-4 py-3 rounded-xl font-bold text-sm"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            )}

            {!pending && done && (
              <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                Votre réponse a bien été enregistrée. Merci.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InternatAutorisationPage() {
  return (
    <Suspense fallback={<p className="text-center py-10 text-slate-500">Chargement…</p>}>
      <AutorisationContent />
    </Suspense>
  );
}

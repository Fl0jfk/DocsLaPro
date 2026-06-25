"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BienEtreSignalement, BienEtreSignalementIndexEntry } from "@/app/lib/bien-etre-types";

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  cloture: "Clôturé",
};

function ReferentContent() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");
  const [items, setItems] = useState<BienEtreSignalementIndexEntry[]>([]);
  const [detail, setDetail] = useState<BienEtreSignalement | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/bien-etre/signalements", { cache: "no-store" });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Erreur");
    setItems(j.items || []);
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/bien-etre/signalements?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Erreur");
    setDetail(j.signalement);
    setNote(j.signalement?.referentNote || "");
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadList();
        if (selectedId) await loadDetail(selectedId);
        else setDetail(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId, loadList, loadDetail]);

  const updateStatus = async (status: "nouveau" | "en_cours" | "cloture") => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch("/api/bien-etre/signalements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: detail.id, status, referentNote: note }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      setDetail(j.signalement);
      await loadList();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Signalements bien-être</h1>
          <p className="text-slate-500 mt-1">Transmis par les élèves au psychologue</p>
        </div>
        <Link href="/bien-etre/config" className="text-sm font-bold text-violet-700 underline">
          Configuration →
        </Link>
      </div>

      {error ? <p className="text-red-600 mb-4">{error}</p> : null}
      {loading ? <p className="text-slate-500">Chargement…</p> : null}

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <h2 className="font-black text-lg px-4 py-3 border-b bg-slate-50">Liste</h2>
          <ul className="divide-y max-h-[32rem] overflow-y-auto">
            {items.length === 0 ? (
              <li className="p-4 text-sm text-slate-500">Aucun signalement.</li>
            ) : (
              items.map((it) => (
                <li key={it.id}>
                  <Link
                    href={`/bien-etre/referent?id=${encodeURIComponent(it.id)}`}
                    className={`block px-4 py-3 hover:bg-violet-50 ${selectedId === it.id ? "bg-violet-50" : ""}`}
                  >
                    <p className="font-bold text-slate-900">{it.prenom}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(it.createdAt).toLocaleString("fr-FR")} · {STATUS_LABELS[it.status] || it.status} ·{" "}
                      {it.severity}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5">
          {detail ? (
            <div className="space-y-4">
              <h2 className="text-xl font-black">{detail.prenom}</h2>
              <p className="text-sm text-slate-500">
                {new Date(detail.createdAt).toLocaleString("fr-FR")}
                {detail.classe ? ` · ${detail.classe}` : ""}
              </p>
              <p>
                <span className="text-xs font-bold uppercase text-slate-400">Gravité</span> — {detail.severity}
              </p>
              <p>
                <span className="text-xs font-bold uppercase text-slate-400">Catégories</span> —{" "}
                {detail.categories.join(", ") || "—"}
              </p>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Résumé</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-3">
                  {detail.summary}
                </p>
              </div>
              {detail.complement ? (
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Complément élève</p>
                  <p className="text-sm whitespace-pre-wrap">{detail.complement}</p>
                </div>
              ) : null}
              <label className="block text-sm font-semibold">
                Note interne
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => updateStatus("en_cours")}
                  className="rounded-xl bg-amber-100 text-amber-900 font-bold px-4 py-2 text-sm"
                >
                  En cours
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => updateStatus("cloture")}
                  className="rounded-xl bg-slate-200 font-bold px-4 py-2 text-sm"
                >
                  Clôturer
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Sélectionnez un signalement dans la liste.</p>
          )}
        </section>
      </div>
    </main>
  );
}

export default function BienEtreReferentPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Chargement…</p>}>
      <ReferentContent />
    </Suspense>
  );
}

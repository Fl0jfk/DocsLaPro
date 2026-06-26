"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { BienEtreConfig } from "@/app/lib/bien-etre-types";

export default function BienEtreConfigPage() {
  const [config, setConfig] = useState<BienEtreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bien-etre/config", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      setConfig(j.config);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/bien-etre/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      setConfig(j.config);
      setMsg("Configuration enregistrée.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
      <main className="max-w-2xl mx-auto p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Bot bien-être</h1>
            <p className="text-slate-500 mt-1">Configuration — écoute élèves et signalements</p>
          </div>
          <Link href="/bien-etre/referent" className="text-sm font-bold text-violet-700 underline">
            Voir les signalements →
          </Link>
        </div>

        {loading ? <p className="text-slate-500">Chargement…</p> : null}
        {error ? <p className="text-red-600 mb-4">{error}</p> : null}
        {msg ? <p className="text-emerald-700 mb-4">{msg}</p> : null}

        {config ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="font-semibold">Activer le bot bien-être pour les élèves</span>
            </label>

            <label className="block text-sm font-semibold">
              E-mail du psychologue (destinataire des signalements)
              <input
                type="email"
                value={config.psychologistEmail}
                onChange={(e) => setConfig({ ...config, psychologistEmail: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="psychologue@etablissement.fr"
              />
            </label>

            <label className="block text-sm font-semibold">
              E-mail expéditeur des notifications (optionnel — compte SMTP dédié recommandé)
              <input
                type="email"
                value={config.notificationFromEmail || ""}
                onChange={(e) => setConfig({ ...config, notificationFromEmail: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="notifications-bienetre@…"
              />
            </label>

            <label className="block text-sm font-semibold">
              Rétention des signalements (jours)
              <input
                type="number"
                min={7}
                max={365}
                value={config.retentionDays}
                onChange={(e) => setConfig({ ...config, retentionDays: Number(e.target.value) || 90 })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>

            <label className="block text-sm font-semibold">
              Message d&apos;accueil
              <textarea
                value={config.welcomeMessage || ""}
                onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>

            <p className="text-xs text-slate-500">
              Les comptes élèves utilisent la bulle <strong>💜 bien-être</strong> sur le tableau de bord (pas Nico).
              Référent : <code className="bg-slate-100 px-1 rounded">/bien-etre/referent</code>
            </p>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-2xl bg-violet-600 text-white font-black px-6 py-3 disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        ) : null}
      </main>
  );
}

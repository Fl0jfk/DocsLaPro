"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MarketingShell from "@/app/components/landing/MarketingShell";
import { SCOLA_GRADIENT_TEXT } from "@/app/lib/marketing-theme";
import {
  clearLastPortalTenant,
  readLastPortalTenant,
  saveLastPortalTenant,
} from "@/app/lib/tenant-portal-client";

type TenantEntry = {
  slug: string;
  kind: string;
  kindLabel: string;
  label: string;
  postalAddressLabel: string;
  logoUrl: string | null;
  signInUrl: string;
};

export default function ConnexionPage() {
  const [tenants, setTenants] = useState<TenantEntry[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tenants/public", { cache: "no-store" });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Chargement impossible");
        const list = (j.tenants ?? []) as TenantEntry[];
        if (!cancelled) {
          setTenants(list);
          const saved = readLastPortalTenant();
          if (saved) {
            const hit = list.find((t) => t.slug === saved.slug);
            if (hit) {
              setSelectedSlug(hit.slug);
              setSavedLabel(hit.label);
            }
          } else if (list.length === 1) {
            setSelectedSlug(list[0].slug);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => tenants.find((t) => t.slug === selectedSlug) ?? null,
    [tenants, selectedSlug],
  );

  const continueToSignIn = () => {
    if (!selected) return;
    saveLastPortalTenant({
      slug: selected.slug,
      label: selected.label,
      signInUrl: selected.signInUrl,
    });
    window.location.href = selected.signInUrl;
  };

  const quickReconnect = () => {
    if (!selected) return;
    saveLastPortalTenant({
      slug: selected.slug,
      label: selected.label,
      signInUrl: selected.signInUrl,
    });
    window.location.href = selected.signInUrl;
  };

  const forgetEstablishment = () => {
    clearLastPortalTenant();
    setSavedLabel(null);
    setSelectedSlug("");
  };

  return (
    <MarketingShell>
      <main className="mx-auto max-w-xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-black text-[#14231A]">
            Connexion à votre <span className={SCOLA_GRADIENT_TEXT}>intranet</span>
          </h1>
          <p className="mt-3 text-sm text-stone-600">
            Sélectionnez votre établissement. Votre dernier choix est mémorisé sur cet appareil
            (stockage local, pas de cookie).
          </p>
        </div>

        {loading && <p className="mt-10 text-center text-sm text-stone-500">Chargement…</p>}
        {error && <p className="mt-10 text-center text-sm text-red-600">{error}</p>}

        {!loading && !error && savedLabel && selected && (
          <div className="mt-8 rounded-2xl border border-[#2F6B4A]/20 bg-emerald-50/80 p-4">
            <p className="text-sm text-stone-700">
              Dernier établissement : <strong>{savedLabel}</strong>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={quickReconnect}
                className="rounded-full bg-gradient-to-r from-[#2F6B4A] to-[#1E4A32] px-4 py-2 text-xs font-bold text-white"
              >
                Reprendre la connexion
              </button>
              <button
                type="button"
                onClick={forgetEstablishment}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-600"
              >
                Changer d&apos;établissement
              </button>
            </div>
          </div>
        )}

        {!loading && !error && tenants.length > 0 && (
          <div className="mt-8 space-y-6">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-stone-700">Établissement</span>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#2F6B4A]/15 bg-white/90 px-4 py-3.5 text-sm shadow-sm outline-none focus:border-[#2F6B4A]/40"
              >
                <option value="">— Choisir un établissement —</option>
                {tenants.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.label} — {t.kindLabel} — {t.postalAddressLabel || "Adresse non renseignée"}
                  </option>
                ))}
              </select>
            </label>

            {selected && (
              <div className="flex items-start gap-4 rounded-2xl border border-[#2F6B4A]/15 bg-white/90 p-4">
                {selected.logoUrl ? (
                  <Image
                    src={selected.logoUrl}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-xl object-contain bg-white"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg font-black text-[#2F6B4A]">
                    {selected.label.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 text-sm">
                  <p className="font-bold text-[#14231A]">{selected.label}</p>
                  <p className="text-stone-500">{selected.kindLabel}</p>
                  <p className="mt-1 text-stone-600">
                    {selected.postalAddressLabel || "Adresse postale non renseignée"}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={continueToSignIn}
              disabled={!selected}
              className="w-full rounded-full bg-gradient-to-r from-[#2F6B4A] to-[#1E4A32] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 disabled:opacity-50"
            >
              Continuer vers la connexion
            </button>
          </div>
        )}

        {!loading && !error && tenants.length === 0 && (
          <p className="mt-10 text-center text-sm text-stone-500">Aucun établissement disponible.</p>
        )}

        <p className="mt-10 text-center text-xs text-stone-500">
          Vous gérez la plateforme Scola ?{" "}
          <Link href="/sign-in?redirect_url=/plateforme" className="font-semibold text-violet-700 hover:underline">
            Administration
          </Link>
        </p>
      </main>
    </MarketingShell>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
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
  primaryHostname: string | null;
};

function EstablishmentCard({
  tenant,
  isLastUsed,
  onConnect,
}: {
  tenant: TenantEntry;
  isLastUsed: boolean;
  onConnect: (t: TenantEntry) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onConnect(tenant)}
      className={`group relative w-full overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition-all hover:border-[#2F6B4A]/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B4A] focus-visible:ring-offset-2 ${
        isLastUsed ? "border-[#2F6B4A]/35 ring-1 ring-[#2F6B4A]/20" : "border-stone-200/80"
      }`}
    >
      {isLastUsed && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1E4A32]">
          Dernier choix
        </span>
      )}

      <div className="flex items-start gap-4 p-5">
        {tenant.logoUrl ? (
          <Image
            src={tenant.logoUrl}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-xl object-contain bg-stone-50 p-1"
            unoptimized
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-2xl font-black text-[#2F6B4A]">
            {tenant.label.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-bold text-[#14231A] text-lg leading-tight">{tenant.label}</p>
          <p className="mt-1 text-sm text-stone-500">{tenant.kindLabel}</p>
          {tenant.postalAddressLabel ? (
            <p className="mt-2 text-sm text-stone-600 line-clamp-2">{tenant.postalAddressLabel}</p>
          ) : (
            <p className="mt-2 text-sm text-stone-400 italic">Adresse non renseignée</p>
          )}
          {tenant.primaryHostname && (
            <p className="mt-2 font-mono text-[11px] text-stone-400">{tenant.primaryHostname}</p>
          )}
        </div>
      </div>

      {/* Overlay connexion au survol / focus */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#1F3D2B]/88 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden
      >
        <span className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#1F3D2B] shadow-lg">
          Connexion
          <span aria-hidden>→</span>
        </span>
      </div>
    </button>
  );
}

export default function ConnexionPage() {
  const [tenants, setTenants] = useState<TenantEntry[]>([]);
  const [lastSlug, setLastSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const connectTo = useCallback((t: TenantEntry) => {
    saveLastPortalTenant({
      slug: t.slug,
      label: t.label,
      signInUrl: t.signInUrl,
    });
    window.location.href = t.signInUrl;
  }, []);

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
          if (saved?.slug && list.some((t) => t.slug === saved.slug)) {
            setLastSlug(saved.slug);
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

  const forgetLast = () => {
    clearLastPortalTenant();
    setLastSlug(null);
  };

  const sortedTenants = [...tenants].sort((a, b) => {
    if (a.slug === lastSlug) return -1;
    if (b.slug === lastSlug) return 1;
    return a.label.localeCompare(b.label, "fr", { sensitivity: "base" });
  });

  return (
    <MarketingShell>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-black text-[#14231A]">
            Connexion à votre <span className={SCOLA_GRADIENT_TEXT}>intranet</span>
          </h1>
          <p className="mt-3 text-sm text-stone-600 max-w-lg mx-auto">
            Cliquez sur votre établissement pour accéder à la page de connexion dédiée.
          </p>
        </div>

        {loading && <p className="mt-12 text-center text-sm text-stone-500">Chargement des établissements…</p>}
        {error && <p className="mt-12 text-center text-sm text-red-600">{error}</p>}

        {!loading && !error && tenants.length > 0 && (
          <div className="mt-10 space-y-4">
            <div className="grid gap-4 sm:grid-cols-1">
              {sortedTenants.map((t) => (
                <EstablishmentCard
                  key={t.slug}
                  tenant={t}
                  isLastUsed={t.slug === lastSlug}
                  onConnect={connectTo}
                />
              ))}
            </div>

            {lastSlug && (
              <p className="text-center pt-2">
                <button
                  type="button"
                  onClick={forgetLast}
                  className="text-xs font-medium text-stone-500 underline-offset-2 hover:text-stone-700 hover:underline"
                >
                  Oublier mon dernier établissement sur cet appareil
                </button>
              </p>
            )}
          </div>
        )}

        {!loading && !error && tenants.length === 0 && (
          <p className="mt-12 text-center text-sm text-stone-500">Aucun établissement disponible.</p>
        )}

        <p className="mt-12 text-center text-xs text-stone-500">
          Vous gérez la plateforme Scola ?{" "}
          <Link href="/sign-in?redirect_url=/plateforme" className="font-semibold text-violet-700 hover:underline">
            Administration
          </Link>
        </p>
      </main>
    </MarketingShell>
  );
}

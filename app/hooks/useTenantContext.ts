"use client";

import { useEffect, useState } from "react";

export type TenantEstablishment = {
  id: string;
  label: string;
  directorName?: string;
  directorEmail?: string;
  clerkRoleSlugs?: string[];
  active?: boolean;
};

type TenantContextPayload = {
  orgId: string;
  identity: { name: string; shortName?: string };
  establishments: TenantEstablishment[];
};

export function useTenantContext() {
  const [data, setData] = useState<TenantContextPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tenant/context", { cache: "no-store" });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Contexte indisponible");
        if (!cancelled) setData(j);
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

  return { data, loading, error };
}

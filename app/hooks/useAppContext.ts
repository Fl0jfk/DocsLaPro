"use client";

import { useEffect, useState } from "react";
import type {
  DomainPlanningModuleConfig,
  Establishment,
  ProfRoomModuleConfig,
} from "@/app/lib/app-config-schemas";

type AppContextPayload = {
  identity: { name: string; shortName?: string };
  establishments: Establishment[];
  profRoom?: ProfRoomModuleConfig;
  domainPlanning?: DomainPlanningModuleConfig;
  session?: {
    intranetRoles: string[];
    isGlobalAdmin: boolean;
  };
};

export function useAppContext() {
  const [data, setData] = useState<AppContextPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/app/context", { cache: "no-store" });
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

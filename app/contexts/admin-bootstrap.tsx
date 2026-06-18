"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import DashboardBootstrapOverlay from "@/app/components/Dashboard/DashboardBootstrapOverlay";
import {
  applyDashboardBrandToDocument,
  readCachedDashboardAccent,
  writeCachedDashboardAccent,
} from "@/app/lib/dashboard-accent-cache";
import { parseDashboardAccent } from "@/app/lib/dashboard-brand-presets";
import type {
  DomainPlanningModuleConfig,
  Establishment,
  ProfRoomModuleConfig,
} from "@/app/lib/app-config-schemas";

export type AppContextPayload = {
  identity: { name: string; shortName?: string; dashboardAccent?: string };
  establishments: Establishment[];
  profRoom?: ProfRoomModuleConfig;
  domainPlanning?: DomainPlanningModuleConfig;
  session?: {
    intranetRoles: string[];
    isGlobalAdmin: boolean;
  };
};

export type SitePublicIdentity = {
  name?: string;
  shortName?: string;
  headerLogoUrl?: string | null;
};

type AdminBootstrapContextValue = {
  appContext: AppContextPayload | null;
  sitePublic: SitePublicIdentity | null;
  loading: boolean;
  error: string | null;
};

export const AdminBootstrapContext = createContext<AdminBootstrapContextValue | null>(null);

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

export function useAdminBootstrap(): AdminBootstrapContextValue {
  const ctx = useContext(AdminBootstrapContext);
  if (!ctx) {
    throw new Error("useAdminBootstrap doit être utilisé dans AdminBootstrapProvider");
  }
  return ctx;
}

export function AdminBootstrapProvider({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded } = useUser();

  const [appContext, setAppContext] = useState<AppContextPayload | null>(null);
  const [sitePublic, setSitePublic] = useState<SitePublicIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accentReady, setAccentReady] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const shouldBlock = !clerkLoaded || loading || !assetsReady;
  const [overlayOpen, setOverlayOpen] = useState(true);

  useLayoutEffect(() => {
    const cached = readCachedDashboardAccent();
    if (cached) {
      applyDashboardBrandToDocument(cached);
      setAccentReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ctxRes, siteRes] = await Promise.all([
          fetch("/api/app/context", { cache: "no-store" }),
          fetch("/api/site/public", { cache: "no-store" }),
        ]);
        const ctxJson = (await ctxRes.json()) as AppContextPayload & { error?: string };
        const siteJson = (await siteRes.json()) as SitePublicIdentity;
        if (!ctxRes.ok) throw new Error(ctxJson.error || "Contexte indisponible");
        if (!cancelled) {
          setAppContext(ctxJson);
          if (siteRes.ok) setSitePublic(siteJson);
          const accent = parseDashboardAccent(ctxJson.identity?.dashboardAccent);
          writeCachedDashboardAccent(accent);
          applyDashboardBrandToDocument(accent);
          setAccentReady(true);

          const logoUrl = siteRes.ok ? siteJson.headerLogoUrl?.trim() : "";
          if (logoUrl) {
            await preloadImage(logoUrl);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setAssetsReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setOverlayOpen(shouldBlock);
  }, [shouldBlock]);

  const value = useMemo(
    () => ({ appContext, sitePublic, loading, error }),
    [appContext, sitePublic, loading, error],
  );

  return (
    <AdminBootstrapContext.Provider value={value}>
      <DashboardBootstrapOverlay open={overlayOpen} accentReady={accentReady} />
      {children}
    </AdminBootstrapContext.Provider>
  );
}

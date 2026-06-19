"use client";

import { createContext, useContext, PropsWithChildren, useEffect, useState } from "react";
import {
  getDashboardCategories,
  type DashboardCategory,
  type DashboardTileVariant,
  type ExternalQuickLink,
} from "@/app/lib/intranet-modules";

export type { DashboardTileVariant };
export type Categories = DashboardCategory;
export type { ExternalQuickLink };

type Data = {
  categories: DashboardCategory[];
  externalQuickLinks: ExternalQuickLink[];
  travels: [];
  documents: [];
  error: null;
};

const DataContext = createContext<Data | undefined>(undefined);

export const DataProvider = ({ children }: PropsWithChildren<object>) => {
  const [data, setData] = useState<Data>({
    categories: getDashboardCategories(),
    externalQuickLinks: [],
    travels: [],
    documents: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/links", { cache: "no-store" });
        const j = await res.json();
        if (!cancelled && res.ok && Array.isArray(j.links)) {
          setData((prev) => ({ ...prev, externalQuickLinks: j.links }));
        }
      } catch {
        /* liens optionnels */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};

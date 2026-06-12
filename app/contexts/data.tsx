"use client";

import { createContext, useContext, PropsWithChildren } from "react";
import {
  getDashboardCategories,
  getExternalQuickLinks,
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

const STATIC_DATA: Data = {
  categories: getDashboardCategories(),
  externalQuickLinks: getExternalQuickLinks(),
  travels: [],
  documents: [],
  error: null,
};

const DataContext = createContext<Data | undefined>(undefined);

export const DataProvider = ({ children }: PropsWithChildren<object>) => (
  <DataContext.Provider value={STATIC_DATA}>{children}</DataContext.Provider>
);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};

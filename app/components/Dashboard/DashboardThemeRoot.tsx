"use client";

import { useEffect, type ReactNode } from "react";
import { useAppContext } from "@/app/hooks/useAppContext";
import { dashboardBrandStyle } from "@/app/lib/dashboard-brand";
import { dashboardBrandCssVars, parseDashboardAccent } from "@/app/lib/dashboard-brand-presets";

export default function DashboardThemeRoot({ children }: { children: ReactNode }) {
  const { data } = useAppContext();
  const accent = data?.identity?.dashboardAccent;
  const style = dashboardBrandStyle(accent);

  useEffect(() => {
    const vars = dashboardBrandCssVars(parseDashboardAccent(accent));
    const root = document.documentElement;
    const previous = new Map<string, string>();
    for (const [key, value] of Object.entries(vars)) {
      previous.set(key, root.style.getPropertyValue(key));
      root.style.setProperty(key, value);
    }
    return () => {
      for (const key of Object.keys(vars)) {
        const prev = previous.get(key);
        if (prev) root.style.setProperty(key, prev);
        else root.style.removeProperty(key);
      }
    };
  }, [accent]);

  return (
    <div className="dashboard-themed" style={style}>
      {children}
    </div>
  );
}

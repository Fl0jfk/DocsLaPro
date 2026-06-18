"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ExternalQuickLink } from "@/app/contexts/data";
import {
  emptyQuickLinkSlot,
  loadQuickLinks,
  MAX_DASHBOARD_QUICK_LINKS,
  normalizeQuickLinks,
  saveQuickLinks,
  type DashboardQuickLink,
} from "@/app/lib/dashboard-quick-links";

export function useDashboardQuickLinks(userId: string | undefined, catalogDefaults: ExternalQuickLink[]) {
  const seed = useMemo(
    () =>
      catalogDefaults.map((l) => ({
        id: l.id,
        name: l.name,
        link: l.link,
        img: l.img,
      })),
    [catalogDefaults],
  );

  const catalogKey = catalogDefaults.map((l) => l.id).join("|");
  const [links, setLinks] = useState<DashboardQuickLink[]>(seed);
  const [draft, setDraft] = useState<DashboardQuickLink[]>([]);

  useEffect(() => {
    const { links: saved, fromStorage } = loadQuickLinks(userId);
    setLinks(fromStorage ? saved : seed);
  }, [userId, catalogKey, seed]);

  const initDraft = useCallback(() => {
    const base = links.length > 0 ? links : seed.slice(0, MAX_DASHBOARD_QUICK_LINKS);
    setDraft(base.length > 0 ? [...base] : [emptyQuickLinkSlot(0)]);
  }, [links, seed]);

  const updateDraft = useCallback((index: number, patch: Partial<DashboardQuickLink>) => {
    setDraft((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }, []);

  const addDraftRow = useCallback(() => {
    setDraft((prev) => {
      if (prev.length >= MAX_DASHBOARD_QUICK_LINKS) return prev;
      return [...prev, emptyQuickLinkSlot(prev.length)];
    });
  }, []);

  const removeDraftRow = useCallback((index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const saveDraft = useCallback(() => {
    const next = normalizeQuickLinks(draft);
    setLinks(next);
    saveQuickLinks(userId, next);
  }, [draft, userId]);

  const clearAll = useCallback(() => {
    setDraft([]);
  }, []);

  const resetDraftFromLinks = useCallback(() => {
    initDraft();
  }, [initDraft]);

  return {
    links,
    draft,
    initDraft,
    updateDraft,
    addDraftRow,
    removeDraftRow,
    saveDraft,
    clearAll,
    resetDraftFromLinks,
  };
}

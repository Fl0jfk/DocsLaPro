"use client";

import { useLayoutEffect, useState } from "react";
import { submitSuppliesPdfInCurrentWindow } from "@/app/lib/fournitures-print-client";

/** Repli : soumet le PDF via formulaire POST (pas de blob / embed). */
export default function SuppliesPrintPage() {
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const key = new URLSearchParams(window.location.search).get("key")?.trim();
    if (!key) {
      setError("Session d'impression introuvable.");
      return;
    }

    const raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    if (!raw) {
      setError("Données d'impression expirées. Relancez depuis le simulateur.");
      return;
    }

    try {
      const payload = JSON.parse(raw) as { children?: unknown[] };
      if (!Array.isArray(payload.children) || payload.children.length === 0) {
        setError("Aucun enfant à imprimer.");
        return;
      }
      submitSuppliesPdfInCurrentWindow(raw);
    } catch {
      setError("Données d'impression invalides.");
    }
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
      Ouverture du PDF…
    </div>
  );
}

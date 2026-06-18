"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Categories } from "@/app/contexts/data";
import BentoStaticWidget from "@/app/components/Dashboard/bento/BentoStaticWidget";
import WeekSheetAddEventModal from "@/app/components/Dashboard/bento/WeekSheetAddEventModal";
import WeekSheetHourGrid from "@/app/components/Dashboard/bento/WeekSheetHourGrid";
import type { BentoWidgetSize } from "@/app/lib/bento-widget-size";
import type { WeekSheetData } from "@/app/lib/dashboard-week-sheet-types";
import { useIsOrgAdmin } from "@/app/hooks/useIsOrgAdmin";

type Props = { category: Categories; size: BentoWidgetSize };

export function WeekSheetBentoWidget({ category, size }: Props) {
  const isOrgAdmin = useIsOrgAdmin();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<WeekSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/week-sheet");
      const json = await res.json();
      let next = (json.data ?? null) as WeekSheetData | null;

      if (next?.sourcePdfKey && !next.multiWeekParsed) {
        setMigrating(true);
        try {
          const mig = await fetch("/api/dashboard/week-sheet/reparse", { method: "POST" });
          const migJson = await mig.json();
          if (mig.ok && migJson.data) next = migJson.data as WeekSheetData;
        } catch {
          /* garder les données existantes */
        } finally {
          setMigrating(false);
        }
      }

      setData(next);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setError("Choisissez un fichier PDF.");
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const prep = await fetch("/api/dashboard/week-sheet/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });
      const prepJson = await prep.json();
      if (!prep.ok) throw new Error(prepJson.error || "Préparation upload impossible.");

      const put = await fetch(prepJson.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!put.ok) throw new Error("Envoi du PDF échoué.");

      const imp = await fetch("/api/dashboard/week-sheet/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: prepJson.key }),
      });
      const impJson = await imp.json();
      if (!imp.ok) throw new Error(impJson.error || "Analyse impossible.");

      setData(impJson.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const compact = size === "sm";

  const headerExtra =
    isOrgAdmin && !importing ? (
      <>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <button
          type="button"
          onClick={() => setAddEventOpen(true)}
          className="rounded-lg border border-[color:var(--dash-border)] bg-white px-2 py-1 text-[10px] font-bold text-[var(--dash-primary)] hover:bg-[color:var(--dash-soft-muted)]"
        >
          + Créneau
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-[color:var(--dash-border)] bg-white px-2 py-1 text-[10px] font-bold text-[var(--dash-primary)] hover:bg-[color:var(--dash-soft-muted)]"
        >
          {data ? "Nouveau PDF" : "Charger PDF"}
        </button>
      </>
    ) : importing ? (
      <span className="text-[10px] font-bold text-[var(--dash-mid)]">Analyse…</span>
    ) : null;

  return (
    <>
      <BentoStaticWidget
        title={category.name}
        iconSrc={category.img}
        subtitle={data?.weekLabel}
        headerExtra={headerExtra}
        articleClassName="h-auto"
        bodyClassName="overflow-x-auto p-2 sm:p-3"
      >
        {loading ? (
          <p className="py-6 text-center text-xs text-stone-400">Chargement…</p>
        ) : importing || migrating ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--dash-border)] border-t-[var(--dash-primary)]" />
            <p className="text-xs font-semibold text-stone-600">
              {importing ? "Lecture du PDF et analyse IA…" : "Mise à jour de la semaine affichée…"}
            </p>
            {importing ? (
              <p className="text-[10px] text-stone-400">Comptez 30 à 90 secondes.</p>
            ) : null}
          </div>
        ) : data?.events?.length ? (
          <WeekSheetHourGrid events={data.events} compact={compact} />
        ) : isOrgAdmin ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-2xl opacity-40" aria-hidden>
              📅
            </p>
            <p className="text-xs font-semibold text-stone-500">
              Chargez un PDF ou ajoutez des créneaux manuellement.
            </p>
            <button
              type="button"
              onClick={() => setAddEventOpen(true)}
              className="rounded-lg border border-[color:var(--dash-border)] bg-white px-3 py-1.5 text-[11px] font-bold text-[var(--dash-primary)] hover:bg-[color:var(--dash-soft-muted)]"
            >
              + Ajouter un créneau
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg bg-[var(--dash-primary)] px-3 py-1.5 text-[11px] font-bold text-white hover:brightness-110"
            >
              Importer un PDF
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <p className="text-2xl opacity-40" aria-hidden>
              📅
            </p>
            <p className="text-xs font-semibold text-stone-500">
              Aucune feuille de semaine publiée pour le moment.
            </p>
          </div>
        )}
        {error ? <p className="mt-2 text-center text-[10px] font-semibold text-red-600">{error}</p> : null}
      </BentoStaticWidget>

      {isOrgAdmin ? (
        <WeekSheetAddEventModal
          open={addEventOpen}
          onAdded={setData}
          onError={setError}
          onClose={() => setAddEventOpen(false)}
        />
      ) : null}
    </>
  );
}

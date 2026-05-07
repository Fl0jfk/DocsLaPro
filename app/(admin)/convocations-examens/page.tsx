"use client";

import { useEffect, useMemo, useState } from "react";

type AbsenceItem = {
  data: {
    teacherName: string;
    examType: string;
    startAt: string;
    endAt: string;
    startDate: string;
    endDate: string;
    documentKey: string;
  };
  id: string;
};

type CalendarEvent = {
  key: string;
  id: string;
  teacherName: string;
  examType: string;
  startAt: string;
  endAt: string;
  hasDocument: boolean;
  displayTime: string;
};

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function sameDay(date: Date, y: number, m: number, d: number) {
  return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTimeFR(date: Date) {
  return `${pad2(date.getHours())}h${pad2(date.getMinutes())}`;
}

export default function ConvocationsExamensPage() {
  const [items, setItems] = useState<AbsenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchConvocations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/convocations", { cache: "no-store" });
      if (!res.ok) throw new Error("Chargement des convocations impossible.");
      const data = (await res.json()) as AbsenceItem[];
      setItems(data || []);
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConvocations();
  }, []);

  const events = useMemo<CalendarEvent[]>(() => {
    const out: CalendarEvent[] = [];

    for (const item of items) {
      const start = new Date(item.data.startAt);
      const end = new Date(item.data.endAt);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
      if (+end <= +start) continue;

      // Expansion multi-jours: si la convocation couvre plusieurs jours, on affiche un event sur chaque journée.
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      for (let cursor = new Date(day); cursor <= last; cursor.setDate(cursor.getDate() + 1)) {
        const y = cursor.getFullYear();
        const m = cursor.getMonth();
        const d = cursor.getDate();
        const isFirstDay = sameDay(cursor, start.getFullYear(), start.getMonth(), start.getDate());
        const isLastDay = sameDay(cursor, end.getFullYear(), end.getMonth(), end.getDate());

        const startAt = isFirstDay ? start.toISOString() : new Date(y, m, d, 0, 0, 0, 0).toISOString();
        const endAt = isLastDay ? end.toISOString() : new Date(y, m, d, 23, 59, 0, 0).toISOString();

        const displayTime =
          isFirstDay && isLastDay
            ? `${formatTimeFR(start)} - ${formatTimeFR(end)}`
            : isFirstDay
              ? `à partir de ${formatTimeFR(start)}`
              : isLastDay
                ? `jusqu'à ${formatTimeFR(end)}`
                : "journée";

        out.push({
          key: `${item.id}_${y}-${pad2(m + 1)}-${pad2(d)}`,
          id: item.id,
          teacherName: item.data.teacherName,
          examType: item.data.examType,
          startAt,
          endAt,
          hasDocument: Boolean(item.data.documentKey),
          displayTime,
        });
      }
    }

    return out.sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
  }, [items]);

  const openConvocation = async (absenceId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/convocations/document-url?id=${encodeURIComponent(absenceId)}`, { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Impossible d'ouvrir le document.");
      const url = String(payload?.url || "");
      if (!url) throw new Error("URL du document manquante.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setError(e?.message || "Erreur ouverture document.");
    }
  };

  const dayCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstDayOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ key: string; date: Date | null; events: CalendarEvent[] }> = [];

    for (let i = 0; i < firstDayOffset; i += 1) {
      cells.push({ key: `empty-start-${i}`, date: null, events: [] });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.startAt);
        return sameDay(eventDate, year, month, day);
      });
      cells.push({ key: `d-${day}`, date, events: dayEvents });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ key: `empty-end-${cells.length}`, date: null, events: [] });
    }
    return cells;
  }, [currentMonth, events]);

  const handleUpload = async (file: File) => {
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploading(true);
      const res = await fetch("/api/convocations/ingest", {
        method: "POST",
        body: formData,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Import impossible.");
      setSuccess(`Import réussi: ${payload?.created?.length || 0} convocation(s) enregistrée(s).`);
      await fetchConvocations();
    } catch (e: any) {
      setError(e?.message || "Erreur pendant l'import.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-black text-slate-900">Convocations examens</h1>
        <p className="text-slate-500 mt-2">Importez une convocation PDF pour créer automatiquement les absences professeurs.</p>
      </div>

      <section className="bg-white border border-slate-200 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-slate-900">Calendrier des absences (convocations)</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              ◀
            </button>
            <span className="text-sm font-bold text-slate-700 min-w-[140px] text-center">
              {currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              ▶
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="text-xs font-black uppercase text-slate-500 px-2 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {dayCells.map((cell) => (
            <div key={cell.key} className="min-h-[120px] border border-slate-100 rounded-xl p-2 bg-slate-50/40">
              {cell.date ? (
                <>
                  <div className="text-xs font-black text-slate-700 mb-2">{cell.date.getDate()}</div>
                  <div className="space-y-1 max-h-[88px] overflow-y-auto pr-1">
                    {cell.events.map((event) => (
                      <button
                        key={event.key}
                        type="button"
                        onClick={() => (event.hasDocument ? openConvocation(event.id) : undefined)}
                        title={event.hasDocument ? "Ouvrir la convocation (PDF)" : "Convocation sans document"}
                        className={[
                          "text-left w-full bg-rose-100 text-rose-800 rounded-lg px-2 py-1 text-[11px] leading-tight",
                          event.hasDocument ? "hover:bg-rose-200 transition-colors" : "opacity-80 cursor-default",
                        ].join(" ")}
                      >
                        <div className="font-bold truncate">{event.teacherName}</div>
                        <div className="truncate">{event.examType}</div>
                        <div className="truncate">{event.displayTime}</div>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl p-6">
        <h2 className="text-xl font-black text-slate-900 mb-4">Importer une convocation PDF</h2>
        <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.currentTarget.value = "";
            }}
            disabled={uploading}
          />
          <p className="text-sm font-semibold text-slate-700">
            {uploading ? "Traitement en cours (OCR + IA)..." : "Cliquez ici pour charger un PDF de convocation"}
          </p>
        </label>

        {loading && <p className="text-sm text-slate-500 mt-3">Chargement des absences...</p>}
        {success && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mt-3">{success}</p>}
        {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 mt-3">{error}</p>}
      </section>
    </div>
  );
}

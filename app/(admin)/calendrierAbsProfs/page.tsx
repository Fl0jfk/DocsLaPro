"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
const WEEKDAYS_ONLY = ["Lun", "Mar", "Mer", "Jeu", "Ven"];

function sameDay(date: Date, y: number, m: number, d: number) {
  return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function localDateInputValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatTimeFR(date: Date) {
  return `${pad2(date.getHours())}h${pad2(date.getMinutes())}`;
}

function typologyFromLabel(label: string) {
  const s = String(label || "").toLowerCase();
  if (s.includes("bac")) return "bac";
  if (s.includes("brevet") || s.includes("dnb")) return "brevet";
  if (s.includes("syndic")) return "syndical";
  if (s.includes("malad") || s.includes("arrêt") || s.includes("arret")) return "maladie";
  if (s.includes("formation")) return "formation";
  return "autre";
}

function classesForTypology(typology: ReturnType<typeof typologyFromLabel>) {
  switch (typology) {
    case "bac":
      return { base: "bg-rose-100 text-rose-800", hover: "hover:bg-rose-200" };
    case "brevet":
      return { base: "bg-indigo-100 text-indigo-800", hover: "hover:bg-indigo-200" };
    case "syndical":
      return { base: "bg-amber-100 text-amber-900", hover: "hover:bg-amber-200" };
    case "maladie":
      return { base: "bg-slate-200 text-slate-900", hover: "hover:bg-slate-300" };
    case "formation":
      return { base: "bg-emerald-100 text-emerald-900", hover: "hover:bg-emerald-200" };
    default:
      return { base: "bg-violet-100 text-violet-900", hover: "hover:bg-violet-200" };
  }
}

type ManualFormState = {
  firstName: string;
  lastName: string;
  examType: string;
  etablissement: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

export default function ConvocationsExamensPage() {
  const [items, setItems] = useState<AbsenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const manualPdfRef = useRef<HTMLInputElement>(null);
  const [manualForm, setManualForm] = useState<ManualFormState>(() => {
    const t = localDateInputValue(new Date());
    return {
      firstName: "",
      lastName: "",
      examType: "",
      etablissement: "Collège",
      startDate: t,
      endDate: t,
      startTime: "08:00",
      endTime: "18:00",
    };
  });
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const selectedYear = currentMonth.getFullYear();
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

  const deleteConvocation = async (id: string) => {
    setError(null);
    setSuccess(null);
    const ok = window.confirm("Supprimer ce créneau ? Cela supprime aussi le document s'il n'est plus utilisé.");
    if (!ok) return;
    try {
      const res = await fetch(`/api/convocations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Suppression impossible.");
      setSuccess("Créneau supprimé.");
      await fetchConvocations();
    } catch (e: any) {
      setError(e?.message || "Erreur suppression.");
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

  const weekdayCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstDayOffsetMon0 = (firstDay.getDay() + 6) % 7; // 0..6 (Lun..Dim)
    const firstDayOffset = Math.min(firstDayOffsetMon0, 5); // si ça commence Sam/Dim, on démarre directement Lun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ key: string; date: Date | null; events: CalendarEvent[] }> = [];
    for (let i = 0; i < firstDayOffset; i += 1) { cells.push({ key: `w-empty-start-${i}`, date: null, events: [] })}
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const weekdayMon0 = (date.getDay() + 6) % 7;
      if (weekdayMon0 >= 5) continue;
      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.startAt);
        return sameDay(eventDate, year, month, day);
      });
      cells.push({ key: `w-d-${day}`, date, events: dayEvents });
    }
    while (cells.length % 5 !== 0) { cells.push({ key: `w-empty-end-${cells.length}`, date: null, events: [] })}
    return cells;
  }, [currentMonth, events]);
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    years.add(selectedYear);
    for (const item of items) {
      const y1 = new Date(item.data.startAt).getFullYear();
      const y2 = new Date(item.data.endAt).getFullYear();
      if (!Number.isNaN(y1)) years.add(y1);
      if (!Number.isNaN(y2)) years.add(y2);
    }
    const list = [...years].sort((a, b) => a - b);
    const min = list[0] ?? selectedYear;
    const max = list[list.length - 1] ?? selectedYear;
    const padded: number[] = [];
    for (let y = min - 2; y <= max + 2; y += 1) padded.push(y);
    return padded;
  }, [items, selectedYear]);

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

  const submitManualAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.append("firstName", manualForm.firstName.trim());
    fd.append("lastName", manualForm.lastName.trim());
    fd.append("examType", manualForm.examType.trim());
    fd.append("etablissement", manualForm.etablissement);
    fd.append("startDate", manualForm.startDate);
    fd.append("endDate", manualForm.endDate);
    fd.append("startTime", manualForm.startTime);
    fd.append("endTime", manualForm.endTime);
    const pdf = manualPdfRef.current?.files?.[0];
    if (pdf) fd.append("justificatif", pdf);
    try {
      setSavingManual(true);
      const res = await fetch("/api/convocations/manual", { method: "POST", body: fd });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Enregistrement impossible.");
      setSuccess("Absence enregistrée (saisie manuelle).");
      const t = localDateInputValue(new Date());
      setManualForm((prev) => ({
        ...prev,
        firstName: "",
        lastName: "",
        examType: "",
        startDate: t,
        endDate: t,
      }));
      if (manualPdfRef.current) manualPdfRef.current.value = "";
      await fetchConvocations();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur pendant la saisie manuelle.");
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-black text-slate-900">Calendrier absences professeurs</h1>
        <p className="text-slate-500 mt-2">
          Déclarez une absence à la main (prénom, nom, dates et heures) ou importez un PDF pour une détection automatique (OCR + IA). Vous pouvez joindre un justificatif PDF même en saisie manuelle.
        </p>
      </div>
      <section className="bg-white border border-slate-200 rounded-none sm:rounded-3xl p-0 sm:p-5 -mx-6 sm:mx-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 px-4 pt-4 sm:px-0 sm:pt-0">
          <h2 className="text-xl font-black text-slate-900">Calendrier des absences (professeurs)</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <select
              className="w-full sm:w-auto px-3 py-2 sm:py-1 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700"
              value={selectedYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                if (!Number.isFinite(y)) return;
                setCurrentMonth(new Date(y, currentMonth.getMonth(), 1));
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="px-3 py-2 sm:py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                ◀
              </button>
              <span className="text-sm font-bold text-slate-700 min-w-[140px] text-center flex-1 sm:flex-none">
                {currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </span>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="px-3 py-2 sm:py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
        <div className="md:hidden px-2 pb-2">
          <div className="grid grid-cols-5 gap-2 mb-2">
            {WEEKDAYS_ONLY.map((day) => (
              <div key={day} className="text-xs font-black uppercase text-slate-500 px-2 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {weekdayCells.map((cell) => (
              <div key={cell.key} className="min-h-[108px] border border-slate-100 rounded-xl p-2 bg-slate-50/40">
                {cell.date ? (
                  <>
                    <div className="text-xs font-black text-slate-700 mb-2">{cell.date.getDate()}</div>
                    <div className="space-y-1">
                      {cell.events.map((event) => (
                        (() => {
                          const color = classesForTypology(typologyFromLabel(event.examType));
                          return (
                        <div
                          key={event.key}
                          role={event.hasDocument ? "button" : undefined}
                          tabIndex={event.hasDocument ? 0 : -1}
                          onClick={() => (event.hasDocument ? openConvocation(event.id) : undefined)}
                          onKeyDown={(e) => {
                            if (!event.hasDocument) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openConvocation(event.id);
                            }
                          }}
                          title={event.hasDocument ? "Ouvrir la convocation (PDF)" : "Convocation sans document"}
                          className={[
                            "relative text-left w-full rounded-lg px-1.5 py-1 text-[10px] leading-snug",
                            color.base,
                            event.hasDocument ? `${color.hover} transition-colors cursor-pointer` : "opacity-80 cursor-default",
                            event.hasDocument ? "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300" : "",
                          ].join(" ")}
                        >
                          <div className="font-bold break-words whitespace-normal">{event.teacherName}</div>
                          <div className="break-words whitespace-normal">{event.examType}</div>
                          <div className="break-words whitespace-normal">{event.displayTime}</div>
                        </div>
                          );
                        })()
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:block">
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
                        (() => {
                          const color = classesForTypology(typologyFromLabel(event.examType));
                          return (
                        <div
                          key={event.key}
                          role={event.hasDocument ? "button" : undefined}
                          tabIndex={event.hasDocument ? 0 : -1}
                          onClick={() => (event.hasDocument ? openConvocation(event.id) : undefined)}
                          onKeyDown={(e) => {
                            if (!event.hasDocument) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openConvocation(event.id);
                            }
                          }}
                          title={event.hasDocument ? "Ouvrir la convocation (PDF)" : "Convocation sans document"}
                          className={[
                            "text-left w-full rounded-lg px-2 py-1 text-[11px] leading-tight",
                            color.base,
                            event.hasDocument ? `${color.hover} transition-colors cursor-pointer` : "opacity-80 cursor-default",
                            event.hasDocument ? "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300" : "",
                          ].join(" ")}
                        >
                          <div className="flex justify-end">
                            <button
                              type="button"
                              aria-label="Supprimer le créneau"
                              title="Supprimer le créneau"
                              className="rounded px-1 text-[10px] font-black opacity-70 hover:opacity-100"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteConvocation(event.id);
                              }}
                            >
                              ✕
                            </button>
                          </div>
                          <div className="font-bold break-words whitespace-normal">{event.teacherName}</div>
                          <div className="break-words whitespace-normal">{event.examType}</div>
                          <div className="break-words whitespace-normal">{event.displayTime}</div>
                        </div>
                          );
                        })()
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-white border border-slate-200 rounded-3xl p-6">
        <h2 className="text-xl font-black text-slate-900 mb-2">Déclarer une absence manuellement</h2>
        <p className="text-sm text-slate-500 mb-4">
          Utile lorsque l&apos;import PDF ne reconnaît pas le professeur ou le créneau. Les dates et heures sont interprétées selon le fuseau horaire de votre navigateur.
        </p>
        <form onSubmit={submitManualAbsence} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Prénom</span>
              <input
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={manualForm.firstName}
                onChange={(e) => setManualForm((p) => ({ ...p, firstName: e.target.value }))}
                disabled={savingManual}
                autoComplete="given-name"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Nom</span>
              <input
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={manualForm.lastName}
                onChange={(e) => setManualForm((p) => ({ ...p, lastName: e.target.value }))}
                disabled={savingManual}
                autoComplete="family-name"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Motif / type d&apos;absence</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Ex. convocation bac, formation, arrêt maladie…"
              value={manualForm.examType}
              onChange={(e) => setManualForm((p) => ({ ...p, examType: e.target.value }))}
              disabled={savingManual}
            />
          </label>
          <label className="block max-w-xs">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Établissement</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800"
              value={manualForm.etablissement}
              onChange={(e) => setManualForm((p) => ({ ...p, etablissement: e.target.value }))}
              disabled={savingManual}
            >
              <option value="École">École</option>
              <option value="Collège">Collège</option>
              <option value="Lycée">Lycée</option>
            </select>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Du (jour)</span>
              <input
                required
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={manualForm.startDate}
                onChange={(e) => setManualForm((p) => ({ ...p, startDate: e.target.value }))}
                disabled={savingManual}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Au (jour)</span>
              <input
                required
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={manualForm.endDate}
                onChange={(e) => setManualForm((p) => ({ ...p, endDate: e.target.value }))}
                disabled={savingManual}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Heure de début (jour du)</span>
              <input
                required
                type="time"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={manualForm.startTime}
                onChange={(e) => setManualForm((p) => ({ ...p, startTime: e.target.value }))}
                disabled={savingManual}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Heure de fin (jour au)</span>
              <input
                required
                type="time"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={manualForm.endTime}
                onChange={(e) => setManualForm((p) => ({ ...p, endTime: e.target.value }))}
                disabled={savingManual}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Justificatif PDF (optionnel)</span>
            <input
              ref={manualPdfRef}
              type="file"
              accept="application/pdf"
              className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold"
              disabled={savingManual}
            />
          </label>
          <button
            type="submit"
            disabled={savingManual}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {savingManual ? "Enregistrement…" : "Enregistrer l'absence"}
          </button>
        </form>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl p-6">
        <h2 className="text-xl font-black text-slate-900 mb-4">Importer un justificatif d'absence en PDF</h2>
        <label
          className={[
            "block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors",
            dragActive ? "border-indigo-500 bg-indigo-50/60" : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40",
            uploading || savingManual ? "opacity-70 cursor-not-allowed" : "",
          ].join(" ")}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!uploading && !savingManual) setDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!uploading && !savingManual) setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            if (uploading || savingManual) return;
            const file = e.dataTransfer.files?.[0];
            if (file) handleUpload(file);
          }}
        >
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.currentTarget.value = "";
            }}
            disabled={uploading || savingManual}
          />
          <p className="text-sm font-semibold text-slate-700">
            {uploading ? "Traitement en cours (OCR + IA)..." : savingManual ? "Enregistrement manuel en cours…" : "Glissez-déposez un PDF ici, ou cliquez pour sélectionner"}
          </p>
        </label>
        {loading && <p className="text-sm text-slate-500 mt-3">Chargement des absences...</p>}
        {success && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mt-3">{success}</p>}
        {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 mt-3">{error}</p>}
      </section>
    </div>
  );
}

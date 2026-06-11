"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { canAdminIngest } from "@/app/lib/absences-types";
import type { AbsenceRecord } from "@/app/lib/absences-types";
import {
  absencesToCalendarEvents,
  appearanceForEvent,
  buildTeacherColorIndexMap,
  sortCalendarEvents,
  type CalendarEvent,
} from "@/app/lib/absences-calendar";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEEKDAYS_ONLY = ["Lun", "Mar", "Mer", "Jeu", "Ven"];

function sameDay(date: Date, y: number, m: number, d: number) {
  return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
}

function isTodayDate(date: Date) {
  const now = new Date();
  return sameDay(date, now.getFullYear(), now.getMonth(), now.getDate());
}

function calendarDayCellClass(date: Date | null, variant: "desktop" | "mobile") {
  const base =
    variant === "mobile" ? "min-h-[108px] border rounded-xl p-2" : "min-h-[120px] h-full border rounded-xl p-2";
  if (!date) return `${base} border-transparent bg-transparent`;
  if (isTodayDate(date)) return `${base} border-sky-400 bg-sky-50/90 ring-2 ring-sky-200/70`;
  return `${base} border-slate-100 bg-slate-50/40`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printDaySummary(date: Date, dayEvents: CalendarEvent[], teacherColorIndexMap: Map<string, number>) {
  const sorted = sortCalendarEvents(dayEvents);
  const dayTitle = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const printedAt = new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
  const countLabel = sorted.length <= 1 ? "1 absence" : `${sorted.length} absences`;

  const rows =
    sorted.length === 0
      ? `<p class="empty">Aucune absence enregistrée pour cette journée.</p>`
      : sorted
          .map((event) => {
            const style = appearanceForEvent(event, teacherColorIndexMap).print;
            return `
              <article class="card" style="background:${style.bg};color:${style.text};border-color:${style.border}">
                <div class="card-head">
                  <div class="teacher">${escapeHtml(event.displayName)}</div>
                  <span class="badge">${escapeHtml(event.reason || "Absence")}</span>
                </div>
                <p class="time">${escapeHtml(event.displayTime)}</p>
                ${event.hasDocument ? `<p class="doc">Justificatif PDF disponible</p>` : ""}
              </article>
            `;
          })
          .join("");

  const html = `
    <div class="absence-day-print-page">
      <div class="absence-day-print-top">
        <div class="absence-day-print-kicker">La Providence Nicolas Barré</div>
        <div class="absence-day-print-title">Absences professeurs</div>
        <div class="absence-day-print-date">Journée du ${escapeHtml(dayTitle)}</div>
        <div class="absence-day-print-meta">Document généré le ${escapeHtml(printedAt)}</div>
        <div class="absence-day-print-count">${escapeHtml(countLabel)}</div>
      </div>
      <div class="absence-day-print-list">${rows}</div>
      <div class="absence-day-print-bottom">Usage interne — calendrier des absences</div>
    </div>
  `;

  const PRINT_ROOT_ID = "absence-day-print-root";
  const PRINT_STYLE_ID = "absence-day-print-style";
  const PRINT_BODY_CLASS = "is-printing-absence-day";

  document.getElementById(PRINT_ROOT_ID)?.remove();
  document.getElementById(PRINT_STYLE_ID)?.remove();
  document.documentElement.classList.remove(PRINT_BODY_CLASS);
  document.body.classList.remove(PRINT_BODY_CLASS);

  const root = document.createElement("div");
  root.id = PRINT_ROOT_ID;
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = html;

  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    #${PRINT_ROOT_ID} { display: none; }

    html.${PRINT_BODY_CLASS},
    body.${PRINT_BODY_CLASS} {
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      background: #fff !important;
    }

    body.${PRINT_BODY_CLASS} > *:not(#${PRINT_ROOT_ID}) {
      display: none !important;
    }

    body.${PRINT_BODY_CLASS} #${PRINT_ROOT_ID} {
      display: block !important;
      position: static !important;
      width: 100% !important;
      min-height: 0 !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    #${PRINT_ROOT_ID} .absence-day-print-page {
      box-sizing: border-box;
      width: 100%;
      margin: 0;
      padding: 0;
      font-family: "Segoe UI", system-ui, sans-serif;
      color: #0f172a;
      background: #fff;
    }
    #${PRINT_ROOT_ID} .absence-day-print-top {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 18px;
      page-break-after: avoid;
    }
    #${PRINT_ROOT_ID} .absence-day-print-kicker {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #64748b;
    }
    #${PRINT_ROOT_ID} .absence-day-print-title {
      margin: 0;
      font-size: 28px;
      font-weight: 900;
      line-height: 1.1;
      color: #0f172a;
    }
    #${PRINT_ROOT_ID} .absence-day-print-date {
      margin: 12px 0 0;
      padding: 10px 12px;
      font-size: 20px;
      font-weight: 800;
      line-height: 1.25;
      color: #0f172a;
      text-transform: capitalize;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    #${PRINT_ROOT_ID} .absence-day-print-meta {
      margin: 10px 0 0;
      font-size: 11px;
      color: #64748b;
    }
    #${PRINT_ROOT_ID} .absence-day-print-count {
      display: inline-block;
      margin-top: 10px;
      padding: 5px 12px;
      border-radius: 999px;
      background: #e2e8f0;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
    }
    #${PRINT_ROOT_ID} .absence-day-print-list { display: grid; gap: 10px; }
    #${PRINT_ROOT_ID} .card {
      border: 1px solid;
      border-radius: 12px;
      padding: 12px 14px;
      break-inside: avoid;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    #${PRINT_ROOT_ID} .card-head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }
    #${PRINT_ROOT_ID} .card .teacher { margin: 0; font-size: 16px; font-weight: 800; }
    #${PRINT_ROOT_ID} .badge { font-size: 11px; font-weight: 700; opacity: 0.9; }
    #${PRINT_ROOT_ID} .time { margin: 8px 0 0; font-size: 13px; font-weight: 600; }
    #${PRINT_ROOT_ID} .doc { margin: 6px 0 0; font-size: 10px; opacity: 0.75; }
    #${PRINT_ROOT_ID} .empty {
      margin: 0;
      padding: 24px;
      text-align: center;
      color: #64748b;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
    }
    #${PRINT_ROOT_ID} .absence-day-print-bottom {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
      page-break-after: avoid;
    }

    @media print {
      @page { size: auto; margin: 12mm; }
      html, body {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(root);
  document.documentElement.classList.add(PRINT_BODY_CLASS);
  document.body.classList.add(PRINT_BODY_CLASS);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    root.remove();
    style.remove();
    document.documentElement.classList.remove(PRINT_BODY_CLASS);
    document.body.classList.remove(PRINT_BODY_CLASS);
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  window.setTimeout(cleanup, 60_000);
  window.setTimeout(() => window.print(), 80);
}

function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

type AbsencesCalendarProps = {
  refreshKey?: number;
};

export default function AbsencesCalendar({ refreshKey = 0 }: AbsencesCalendarProps) {
  const { user, isLoaded: userLoaded } = useUser();
  const [items, setItems] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [attachingPdf, setAttachingPdf] = useState(false);
  const attachPdfRef = useRef<HTMLInputElement>(null);
  const attachTargetIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const selectedYear = currentMonth.getFullYear();

  const canAttachPdf = useMemo(() => {
    if (!userLoaded) return false;
    const rolesRaw = user?.publicMetadata?.role;
    const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
    return canAdminIngest(roles);
  }, [user, userLoaded]);

  const fetchAbsences = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/absences?calendar=true", { cache: "no-store" });
      if (!res.ok) throw new Error("Chargement des absences impossible.");
      const data = (await res.json()) as AbsenceRecord[];
      setItems(data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAbsences();
  }, [refreshKey]);

  const teacherColorIndexMap = useMemo(
    () =>
      buildTeacherColorIndexMap(
        items.filter((item) => item.data.scope === "professeur").map((item) => item.displayName),
      ),
    [items],
  );

  const events = useMemo<CalendarEvent[]>(() => absencesToCalendarEvents(items), [items]);

  const openConvocation = async (absenceId: string, docIndex = 0) => {
    setError(null);
    try {
      const res = await fetch(
        `/api/absences/document-url?id=${encodeURIComponent(absenceId)}&index=${encodeURIComponent(String(docIndex))}`,
        { cache: "no-store" },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Impossible d'ouvrir le document.");
      const url = String(payload?.url || "");
      if (!url) throw new Error("URL du document manquante.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur ouverture document.");
    }
  };

  const triggerAttachPdf = (absenceId: string) => {
    attachTargetIdRef.current = absenceId;
    attachPdfRef.current?.click();
  };

  const handleAttachPdf = async (file: File) => {
    const absenceId = attachTargetIdRef.current;
    if (!absenceId) return;
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.append("id", absenceId);
    fd.append("file", file);
    try {
      setAttachingPdf(true);
      const res = await fetch("/api/absences/attach-document", { method: "POST", body: fd });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Ajout du PDF impossible.");
      setSuccess(`PDF ajouté (${payload?.documentCount || 1} document(s) sur ce créneau).`);
      await fetchAbsences();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'ajout du PDF.");
    } finally {
      setAttachingPdf(false);
      attachTargetIdRef.current = null;
    }
  };

  const deleteConvocation = async (id: string) => {
    setError(null);
    setSuccess(null);
    const ok = window.confirm("Supprimer ce créneau ? Cela supprime aussi le document s'il n'est plus utilisé.");
    if (!ok) return;
    try {
      const res = await fetch(`/api/absences?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Suppression impossible.");
      setSuccess("Créneau supprimé.");
      await fetchAbsences();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur suppression.");
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
      const dayEvents = sortCalendarEvents(
        events.filter((event) => {
          const eventDate = new Date(event.startAt);
          return sameDay(eventDate, year, month, day);
        }),
      );
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
      const dayEvents = sortCalendarEvents(
        events.filter((event) => {
          const eventDate = new Date(event.startAt);
          return sameDay(eventDate, year, month, day);
        }),
      );
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <input
        ref={attachPdfRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleAttachPdf(file);
          e.currentTarget.value = "";
        }}
        disabled={attachingPdf}
      />
      <section className="bg-white border border-slate-200 rounded-none sm:rounded-3xl p-0 sm:p-5 -mx-6 sm:mx-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 px-4 pt-4 sm:px-0 sm:pt-0">
          <h2 className="text-xl font-black text-slate-900">Calendrier des absences</h2>
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
              <div key={cell.key} className={calendarDayCellClass(cell.date, "mobile")}>
                {cell.date ? (
                  <>
                    <div className="flex items-center gap-1 mb-2">
                      <span
                        className={[
                          "text-xs font-black",
                          isTodayDate(cell.date) ? "text-sky-800" : "text-slate-700",
                        ].join(" ")}
                      >
                        {cell.date.getDate()}
                      </span>
                      {isTodayDate(cell.date) ? (
                        <span className="text-[8px] font-black uppercase tracking-wide text-sky-700">Auj.</span>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      {cell.events.map((event) => (
                        (() => {
                          const appearance = appearanceForEvent(event, teacherColorIndexMap);
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
                          style={appearance.cardStyle}
                          className={[
                            "relative text-left w-full rounded-lg border px-1.5 py-1 text-[10px] leading-snug",
                            event.hasDocument
                              ? "transition-[filter] cursor-pointer hover:brightness-[0.97]"
                              : "opacity-80 cursor-default",
                            event.hasDocument ? "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300" : "",
                          ].join(" ")}
                        >
                          <div className="font-bold break-words whitespace-normal">{event.displayName}</div>
                          <div className="break-words whitespace-normal">{event.reason}</div>
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

          <div className="grid grid-cols-7 gap-2 items-stretch">
            {dayCells.map((cell) => (
              <div key={cell.key} className={calendarDayCellClass(cell.date, "desktop")}>
                {cell.date ? (
                  <>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span
                        className={[
                          "inline-flex items-center gap-1 text-xs font-black",
                          isTodayDate(cell.date) ? "text-sky-800" : "text-slate-700",
                        ].join(" ")}
                      >
                        {cell.date.getDate()}
                        {isTodayDate(cell.date) ? (
                          <span className="text-[9px] font-black uppercase tracking-wide text-sky-700">Auj.</span>
                        ) : null}
                      </span>
                      {cell.events.length > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            printDaySummary(cell.date!, cell.events, teacherColorIndexMap);
                          }}
                          className="rounded-md p-0.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
                          aria-label={`Imprimer le résumé du ${cell.date.toLocaleDateString("fr-FR")}`}
                          title="Imprimer le résumé des absences du jour"
                        >
                          <PrinterIcon className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      {cell.events.map((event) => (
                        (() => {
                          const appearance = appearanceForEvent(event, teacherColorIndexMap);
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
                          style={appearance.cardStyle}
                          className={[
                            "text-left w-full rounded-lg border px-2 py-1 text-[11px] leading-tight",
                            event.hasDocument
                              ? "transition-[filter] cursor-pointer hover:brightness-[0.97]"
                              : "opacity-80 cursor-default",
                            event.hasDocument ? "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300" : "",
                          ].join(" ")}
                        >
                          <div className="flex justify-end items-center gap-0.5">
                            {canAttachPdf ? (
                              <button
                                type="button"
                                aria-label="Ajouter un PDF"
                                title="Ajouter un PDF (justificatif)"
                                className="rounded px-0.5 opacity-70 hover:opacity-100"
                                disabled={attachingPdf}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  triggerAttachPdf(event.id);
                                }}
                              >
                                <PaperclipIcon className="h-3 w-3" />
                              </button>
                            ) : null}
                            {event.documentCount > 1
                              ? Array.from({ length: event.documentCount }, (_, docIdx) => (
                                  <button
                                    key={docIdx}
                                    type="button"
                                    className="rounded px-0.5 text-[9px] font-bold underline opacity-80 hover:opacity-100"
                                    title={`Ouvrir le PDF ${docIdx + 1}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openConvocation(event.id, docIdx);
                                    }}
                                  >
                                    {docIdx + 1}
                                  </button>
                                ))
                              : null}
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
                          <div className="font-bold break-words whitespace-normal">{event.displayName}</div>
                          <div className="break-words whitespace-normal">{event.reason}</div>
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
        {loading && <p className="text-sm text-slate-500 mt-3 px-4 sm:px-0">Chargement des absences…</p>}
        {success && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mt-3 mx-4 sm:mx-0">
            {success}
          </p>
        )}
        {error && (
          <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 mt-3 mx-4 sm:mx-0">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}

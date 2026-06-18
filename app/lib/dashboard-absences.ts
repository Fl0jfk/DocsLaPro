import { schoolWeekDaysParis } from "./dashboard-week";
import { getPublicAbsenceReason } from "./absences-privacy";
import type { AbsenceRecord } from "./absences-types";

export type AbsenceDashboardRow = {
  id: string;
  displayName: string;
  reason: string;
  data: {
    scope?: AbsenceRecord["data"]["scope"];
    startAt: string;
    endAt: string;
  };
  privacyReasonRedacted?: boolean;
};

export type AbsenceTodayRow = {
  id: string;
  teacherName: string;
  examType: string;
  timeLabel: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTimeFR(date: Date) {
  return `${pad2(date.getHours())}h${pad2(date.getMinutes())}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export type AbsenceWeekRow = AbsenceTodayRow & { dayKey: string; dayLabel: string };

function parisDayKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

function formatDayLabel(dayKey: string): string {
  const [y, m, day] = dayKey.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function absencesForDay(items: AbsenceDashboardRow[], day: Date): AbsenceTodayRow[] {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
  const out: AbsenceTodayRow[] = [];

  for (const item of items) {
    const start = new Date(item.data.startAt);
    const end = new Date(item.data.endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || +end <= +start) continue;
    if (+end < +dayStart || +start > +dayEnd) continue;

    const isFirstDay = sameDay(start, day);
    const isLastDay = sameDay(end, day);
    const timeLabel =
      isFirstDay && isLastDay
        ? `${formatTimeFR(start)} – ${formatTimeFR(end)}`
        : isFirstDay
          ? `à partir de ${formatTimeFR(start)}`
          : isLastDay
            ? `jusqu'à ${formatTimeFR(end)}`
            : "journée";

    out.push({
      id: `${item.id}-${parisDayKey(day)}`,
      teacherName: item.displayName,
      examType: getPublicAbsenceReason(item as AbsenceRecord),
      timeLabel,
    });
  }
  return out;
}

export function absencesInWeek(items: AbsenceDashboardRow[]): AbsenceWeekRow[] {
  const out: AbsenceWeekRow[] = [];
  for (const { key: dayKey } of schoolWeekDaysParis()) {
    const [y, m, d] = dayKey.split("-").map(Number);
    const day = new Date(y, m - 1, d);
    for (const row of absencesForDay(items, day)) {
      out.push({ ...row, dayKey, dayLabel: formatDayLabel(dayKey) });
    }
  }
  return out.sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}

export function absencesToday(items: AbsenceDashboardRow[]): AbsenceTodayRow[] {
  const today = new Date();
  const out: AbsenceTodayRow[] = [];

  for (const item of items) {
    const start = new Date(item.data.startAt);
    const end = new Date(item.data.endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || +end <= +start) continue;

    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    if (+end < +dayStart || +start > +dayEnd) continue;

    const isFirstDay = sameDay(start, today);
    const isLastDay = sameDay(end, today);
    const timeLabel =
      isFirstDay && isLastDay
        ? `${formatTimeFR(start)} – ${formatTimeFR(end)}`
        : isFirstDay
          ? `à partir de ${formatTimeFR(start)}`
          : isLastDay
            ? `jusqu'à ${formatTimeFR(end)}`
            : "journée";

    out.push({
      id: item.id,
      teacherName: item.displayName,
      examType: item.reason,
      timeLabel,
    });
  }

  return out.sort((a, b) => a.teacherName.localeCompare(b.teacherName, "fr", { sensitivity: "base" }));
}

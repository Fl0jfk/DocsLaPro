import type { WeekSheetWeek } from "@/app/lib/dashboard-week-sheet-types";

const FRENCH_MONTHS: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
};

function normalizeLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** Déduit le lundi (YYYY-MM-DD) depuis un libellé « Semaine du 8 au 14 juin ». */
export function inferWeekStartFromLabel(label?: string, refYear?: number): string | undefined {
  if (!label?.trim()) return undefined;
  const text = normalizeLabel(label);
  const match = text.match(/du\s+(\d{1,2})\s+au\s+(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/);
  if (!match) return undefined;

  const day = Number(match[1]);
  const month = FRENCH_MONTHS[match[3]];
  if (!month || day < 1 || day > 31) return undefined;

  const year = match[4] ? Number(match[4]) : (refYear ?? new Date().getFullYear());
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function enrichWeekSheetWeek(week: WeekSheetWeek): WeekSheetWeek {
  const weekStart = week.weekStart?.trim() || inferWeekStartFromLabel(week.weekLabel);
  return {
    ...week,
    weekStart,
  };
}

export function splitOcrByWeekSections(ocrText: string): string[] {
  const markers = [...ocrText.matchAll(/Semaine du[^\n]*/gi)];
  if (markers.length < 2) return [ocrText];

  const sections: string[] = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index ?? 0;
    const end = markers[i + 1]?.index ?? ocrText.length;
    const chunk = ocrText.slice(start, end).trim();
    if (chunk) sections.push(chunk);
  }
  return sections.length > 0 ? sections : [ocrText];
}

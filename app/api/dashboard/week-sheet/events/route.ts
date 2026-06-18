import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/intranet-auth";
import { pickActiveWeekSheet } from "@/app/lib/dashboard-week-sheet-active";
import { normalizeWeekDay, parseTimeToMinutes } from "@/app/lib/dashboard-week-sheet-time";
import { loadWeekSheetData, saveWeekSheetData } from "@/app/lib/dashboard-week-sheet-storage";
import type { WeekDayKey, WeekSheetData, WeekSheetEvent } from "@/app/lib/dashboard-week-sheet-types";
import { calendarDateKeyParis } from "@/app/lib/domain-planning-dates";

function newEventId(): string {
  return `ev-manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function weekEndFriday(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d + 4, 12, 0, 0));
  return end.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

function appendEventToSheet(existing: WeekSheetData, event: WeekSheetEvent): WeekSheetData {
  if (existing.weeks?.length) {
    const today = calendarDateKeyParis();
    const weeks = existing.weeks.map((w) => ({ ...w, events: [...w.events] }));
    let idx = weeks.findIndex(
      (w) => w.weekStart && today >= w.weekStart && today <= weekEndFriday(w.weekStart),
    );
    if (idx < 0) idx = 0;
    weeks[idx].events.push(event);
    const active = weeks[idx];
    return {
      ...existing,
      weeks,
      weekLabel: active.weekLabel,
      weekStart: active.weekStart,
      events: active.events,
    };
  }
  return { ...existing, events: [...existing.events, event] };
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const dayRaw = typeof body.day === "string" ? body.day.trim() : "";
    const day = (normalizeWeekDay(dayRaw) ?? dayRaw) as WeekDayKey;
    const validDays = ["mon", "tue", "wed", "thu", "fri"];
    if (!validDays.includes(day)) {
      return NextResponse.json({ error: "Jour invalide." }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const startTime = typeof body.startTime === "string" ? body.startTime.trim() : "";
    const endTime = typeof body.endTime === "string" ? body.endTime.trim() : "";
    const location = typeof body.location === "string" ? body.location.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Intitulé requis." }, { status: 400 });
    }
    if (!startTime || parseTimeToMinutes(startTime) === null) {
      return NextResponse.json({ error: "Heure de début invalide (ex. 8h30)." }, { status: 400 });
    }
    if (endTime && parseTimeToMinutes(endTime) === null) {
      return NextResponse.json({ error: "Heure de fin invalide." }, { status: 400 });
    }
    if (endTime && parseTimeToMinutes(endTime)! <= parseTimeToMinutes(startTime)!) {
      return NextResponse.json({ error: "L'heure de fin doit être après le début." }, { status: 400 });
    }

    const event: WeekSheetEvent = {
      id: newEventId(),
      day,
      startTime,
      title,
      ...(endTime ? { endTime } : {}),
      ...(location ? { location } : {}),
      ...(notes ? { notes } : {}),
    };

    const existing = (await loadWeekSheetData()) ?? { events: [] };
    const payload = appendEventToSheet(existing, event);

    await saveWeekSheetData(payload);
    const stored = await loadWeekSheetData();
    const data = stored ? pickActiveWeekSheet(stored) : null;

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("[dashboard/week-sheet/events POST]", e);
    return NextResponse.json({ error: "Impossible d'ajouter le créneau." }, { status: 500 });
  }
}

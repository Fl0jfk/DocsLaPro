import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/intranet-auth";
import { normalizeWeekDay, parseTimeToMinutes } from "@/app/lib/dashboard-week-sheet-time";
import { loadWeekSheetData, saveWeekSheetData } from "@/app/lib/dashboard-week-sheet-storage";
import type { WeekDayKey, WeekSheetEvent } from "@/app/lib/dashboard-week-sheet-types";

function newEventId(): string {
  return `ev-manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
    const payload = {
      ...existing,
      events: [...existing.events, event],
    };

    await saveWeekSheetData(payload);
    const data = await loadWeekSheetData();

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("[dashboard/week-sheet/events POST]", e);
    return NextResponse.json({ error: "Impossible d'ajouter le créneau." }, { status: 500 });
  }
}

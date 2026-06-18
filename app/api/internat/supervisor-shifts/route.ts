import { NextResponse } from "next/server";
import { requireInternatAccess, requireInternatManage } from "@/app/api/internat/_auth";
import { getInternatSupervisorShifts, saveInternatSupervisorShifts } from "@/app/lib/internat-storage";
import { newId, type InternatSupervisorShift } from "@/app/lib/internat-types";

export async function GET() {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;
  const shifts = await getInternatSupervisorShifts();
  return NextResponse.json({ shifts: shifts.sort((a, b) => b.date.localeCompare(a.date)) });
}

export async function POST(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;
  const body = await req.json().catch(() => ({}));
  const date = String(body.date || "").trim();
  const supervisorName = String(body.supervisorName || "").trim();
  const startTime = String(body.startTime || "").trim();
  const endTime = String(body.endTime || "").trim();
  if (!date || !supervisorName || !startTime || !endTime) {
    return NextResponse.json({ error: "Date, surveillant et horaires requis." }, { status: 400 });
  }
  const shift: InternatSupervisorShift = {
    id: newId("shift"),
    date,
    startTime,
    endTime,
    supervisorName,
    wing:
      body.wing === "garcons" || body.wing === "filles" || body.wing === "mixte" ? body.wing : undefined,
    notes: String(body.notes || "").trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  const shifts = await getInternatSupervisorShifts();
  shifts.push(shift);
  await saveInternatSupervisorShifts(shifts);
  return NextResponse.json({ shift, shifts });
}

export async function DELETE(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;
  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") || "");
  const shifts = (await getInternatSupervisorShifts()).filter((s) => s.id !== id);
  await saveInternatSupervisorShifts(shifts);
  return NextResponse.json({ ok: true, shifts });
}

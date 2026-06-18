import { NextResponse } from "next/server";
import { requireInternatAccess, requireInternatManage } from "@/app/api/internat/_auth";
import { getInternatStudyGroups, saveInternatStudyGroups } from "@/app/lib/internat-storage";
import { newId, type InternatStudyGroup } from "@/app/lib/internat-types";

export async function GET() {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;
  const groups = await getInternatStudyGroups();
  return NextResponse.json({ groups });
}

export async function POST(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;
  const body = await req.json().catch(() => ({}));
  const label = String(body.label || "").trim();
  const startTime = String(body.startTime || "").trim();
  const endTime = String(body.endTime || "").trim();
  const weekday = Number(body.weekday);
  if (!label || !startTime || !endTime || Number.isNaN(weekday)) {
    return NextResponse.json({ error: "Libellé, créneau et jour requis." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const group: InternatStudyGroup = {
    id: newId("study"),
    label,
    room: String(body.room || "").trim() || undefined,
    weekday,
    startTime,
    endTime,
    studentIds: Array.isArray(body.studentIds) ? body.studentIds.map(String) : [],
    supervisorName: String(body.supervisorName || "").trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  const groups = await getInternatStudyGroups();
  groups.push(group);
  await saveInternatStudyGroups(groups);
  return NextResponse.json({ group, groups });
}

export async function PATCH(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const groups = await getInternatStudyGroups();
  const idx = groups.findIndex((g) => g.id === id);
  if (idx < 0) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
  const prev = groups[idx]!;
  groups[idx] = {
    ...prev,
    label: body.label !== undefined ? String(body.label).trim() || prev.label : prev.label,
    room: body.room !== undefined ? String(body.room).trim() || undefined : prev.room,
    weekday: body.weekday !== undefined ? Number(body.weekday) : prev.weekday,
    startTime: body.startTime !== undefined ? String(body.startTime) : prev.startTime,
    endTime: body.endTime !== undefined ? String(body.endTime) : prev.endTime,
    studentIds: Array.isArray(body.studentIds) ? body.studentIds.map(String) : prev.studentIds,
    supervisorName:
      body.supervisorName !== undefined ? String(body.supervisorName).trim() || undefined : prev.supervisorName,
    updatedAt: new Date().toISOString(),
  };
  await saveInternatStudyGroups(groups);
  return NextResponse.json({ group: groups[idx], groups });
}

export async function DELETE(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;
  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") || "");
  const groups = (await getInternatStudyGroups()).filter((g) => g.id !== id);
  await saveInternatStudyGroups(groups);
  return NextResponse.json({ ok: true, groups });
}

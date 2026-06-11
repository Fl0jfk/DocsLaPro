import { NextResponse } from "next/server";
import { requireInternatManage, requireInternatAccess } from "@/app/api/internat/_auth";
import { getInternatRooms, saveInternatRooms } from "@/app/lib/internat-storage";
import { newId, type InternatRoom } from "@/app/lib/internat-types";

export async function GET() {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;
  const rooms = await getInternatRooms();
  return NextResponse.json({ rooms });
}

export async function PUT(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "save");

  if (action === "delete") {
    const id = String(body.id || "");
    const rooms = await getInternatRooms();
    await saveInternatRooms(rooms.filter((r) => r.id !== id));
    return NextResponse.json({ ok: true });
  }

  const now = new Date().toISOString();
  const rooms = await getInternatRooms();

  if (action === "create") {
    const label = String(body.label || "").trim();
    const capacity = Number(body.capacity) === 3 ? 3 : 2;
    if (!label) return NextResponse.json({ error: "Nom de chambre requis." }, { status: 400 });
    const room: InternatRoom = {
      id: newId("room"),
      label,
      capacity,
      wing: body.wing === "garcons" || body.wing === "filles" ? body.wing : body.wing === "mixte" ? "mixte" : undefined,
      notes: String(body.notes || "").trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    rooms.push(room);
    await saveInternatRooms(rooms);
    return NextResponse.json({ room, rooms });
  }

  const id = String(body.id || "");
  const idx = rooms.findIndex((r) => r.id === id);
  if (idx < 0) return NextResponse.json({ error: "Chambre introuvable." }, { status: 404 });

  const updated: InternatRoom = {
    ...rooms[idx],
    label: String(body.label || rooms[idx].label).trim() || rooms[idx].label,
    capacity: Number(body.capacity) === 3 ? 3 : 2,
    wing:
      body.wing === "garcons" || body.wing === "filles"
        ? body.wing
        : body.wing === "mixte"
          ? "mixte"
          : rooms[idx].wing,
    notes: body.notes !== undefined ? String(body.notes || "").trim() || undefined : rooms[idx].notes,
    updatedAt: now,
  };
  rooms[idx] = updated;
  await saveInternatRooms(rooms);
  return NextResponse.json({ room: updated, rooms });
}

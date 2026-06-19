import { NextResponse } from "next/server";
import { requireInternatManage, requireInternatAccess } from "@/app/api/internat/_auth";
import {
  getInternatBuildings,
  getInternatRooms,
  saveInternatRooms,
} from "@/app/lib/internat-storage";
import {
  findInternatFloor,
  newId,
  type InternatRoom,
  type InternatWing,
} from "@/app/lib/internat-types";

function parseWing(raw: unknown): InternatWing | undefined {
  if (raw === "garcons" || raw === "filles" || raw === "mixte") return raw;
  return undefined;
}

async function validateRoomPlacement(
  buildingId: string | undefined,
  floorId: string | undefined,
): Promise<string | null> {
  if (!buildingId && !floorId) return null;
  if (!buildingId || !floorId) {
    return "Bâtiment et étage requis ensemble.";
  }
  const buildings = await getInternatBuildings();
  const floor = findInternatFloor(buildings, buildingId, floorId);
  if (!floor) return "Bâtiment ou étage introuvable.";
  if (!floor.inUse) return "Cet étage n'est pas activé pour l'hébergement.";
  return null;
}

export async function GET() {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;
  const [rooms, buildings] = await Promise.all([getInternatRooms(), getInternatBuildings()]);
  return NextResponse.json({ rooms, buildings });
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

  const buildingId =
    body.buildingId !== undefined && body.buildingId !== null && body.buildingId !== ""
      ? String(body.buildingId)
      : undefined;
  const floorId =
    body.floorId !== undefined && body.floorId !== null && body.floorId !== ""
      ? String(body.floorId)
      : undefined;

  if (action === "create") {
    const label = String(body.label || "").trim();
    const capacity = Number(body.capacity) === 3 ? 3 : 2;
    if (!label) return NextResponse.json({ error: "Nom de chambre requis." }, { status: 400 });
    const placementError = await validateRoomPlacement(buildingId, floorId);
    if (placementError) return NextResponse.json({ error: placementError }, { status: 400 });

    const room: InternatRoom = {
      id: newId("room"),
      label,
      capacity,
      buildingId,
      floorId,
      wing: parseWing(body.wing),
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

  const nextBuildingId =
    body.buildingId !== undefined
      ? buildingId
      : rooms[idx].buildingId;
  const nextFloorId =
    body.floorId !== undefined
      ? floorId
      : rooms[idx].floorId;

  const placementError = await validateRoomPlacement(nextBuildingId, nextFloorId);
  if (placementError) return NextResponse.json({ error: placementError }, { status: 400 });

  const updated: InternatRoom = {
    ...rooms[idx],
    label: String(body.label || rooms[idx].label).trim() || rooms[idx].label,
    capacity: Number(body.capacity) === 3 ? 3 : 2,
    buildingId: nextBuildingId,
    floorId: nextFloorId,
    wing: body.wing !== undefined ? parseWing(body.wing) : rooms[idx].wing,
    notes: body.notes !== undefined ? String(body.notes || "").trim() || undefined : rooms[idx].notes,
    updatedAt: now,
  };
  rooms[idx] = updated;
  await saveInternatRooms(rooms);
  return NextResponse.json({ room: updated, rooms });
}

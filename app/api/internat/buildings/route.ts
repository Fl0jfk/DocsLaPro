import { NextResponse } from "next/server";
import { requireInternatManage, requireInternatAccess } from "@/app/api/internat/_auth";
import {
  getInternatBuildings,
  getInternatRooms,
  saveInternatBuildings,
} from "@/app/lib/internat-storage";
import {
  newId,
  sortInternatFloors,
  type InternatBuilding,
  type InternatFloor,
} from "@/app/lib/internat-types";

function nextFloorSortOrder(floors: InternatFloor[]): number {
  if (!floors.length) return 0;
  return Math.max(...floors.map((f) => f.sortOrder)) + 1;
}

function roomsOnBuilding(rooms: Awaited<ReturnType<typeof getInternatRooms>>, buildingId: string) {
  return rooms.filter((r) => r.buildingId === buildingId);
}

function roomsOnFloor(
  rooms: Awaited<ReturnType<typeof getInternatRooms>>,
  buildingId: string,
  floorId: string,
) {
  return rooms.filter((r) => r.buildingId === buildingId && r.floorId === floorId);
}

export async function GET() {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;
  const buildings = await getInternatBuildings();
  return NextResponse.json({ buildings });
}

export async function PUT(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const now = new Date().toISOString();
  const buildings = await getInternatBuildings();
  const rooms = await getInternatRooms();

  if (action === "create_building") {
    const label = String(body.label || "").trim();
    if (!label) return NextResponse.json({ error: "Nom du bâtiment requis." }, { status: 400 });
    const building: InternatBuilding = {
      id: newId("bld"),
      label,
      floors: [],
      notes: String(body.notes || "").trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    buildings.push(building);
    await saveInternatBuildings(buildings);
    return NextResponse.json({ building, buildings });
  }

  if (action === "update_building") {
    const buildingId = String(body.buildingId || "");
    const idx = buildings.findIndex((b) => b.id === buildingId);
    if (idx < 0) return NextResponse.json({ error: "Bâtiment introuvable." }, { status: 404 });
    const label = String(body.label || buildings[idx].label).trim();
    if (!label) return NextResponse.json({ error: "Nom du bâtiment requis." }, { status: 400 });
    buildings[idx] = {
      ...buildings[idx],
      label,
      notes: body.notes !== undefined ? String(body.notes || "").trim() || undefined : buildings[idx].notes,
      updatedAt: now,
    };
    await saveInternatBuildings(buildings);
    return NextResponse.json({ building: buildings[idx], buildings });
  }

  if (action === "delete_building") {
    const buildingId = String(body.buildingId || "");
    if (roomsOnBuilding(rooms, buildingId).length > 0) {
      return NextResponse.json(
        { error: "Impossible : des chambres sont encore rattachées à ce bâtiment." },
        { status: 400 },
      );
    }
    const next = buildings.filter((b) => b.id !== buildingId);
    if (next.length === buildings.length) {
      return NextResponse.json({ error: "Bâtiment introuvable." }, { status: 404 });
    }
    await saveInternatBuildings(next);
    return NextResponse.json({ ok: true, buildings: next });
  }

  if (action === "add_floor") {
    const buildingId = String(body.buildingId || "");
    const idx = buildings.findIndex((b) => b.id === buildingId);
    if (idx < 0) return NextResponse.json({ error: "Bâtiment introuvable." }, { status: 404 });
    const label = String(body.label || "").trim();
    if (!label) return NextResponse.json({ error: "Nom de l'étage requis." }, { status: 400 });
    const floor: InternatFloor = {
      id: newId("flr"),
      label,
      sortOrder:
        body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))
          ? Number(body.sortOrder)
          : nextFloorSortOrder(buildings[idx].floors),
      inUse: body.inUse !== false,
      notes: String(body.notes || "").trim() || undefined,
    };
    buildings[idx] = {
      ...buildings[idx],
      floors: sortInternatFloors([...buildings[idx].floors, floor]),
      updatedAt: now,
    };
    await saveInternatBuildings(buildings);
    return NextResponse.json({ floor, building: buildings[idx], buildings });
  }

  if (action === "update_floor") {
    const buildingId = String(body.buildingId || "");
    const floorId = String(body.floorId || "");
    const bIdx = buildings.findIndex((b) => b.id === buildingId);
    if (bIdx < 0) return NextResponse.json({ error: "Bâtiment introuvable." }, { status: 404 });
    const fIdx = buildings[bIdx].floors.findIndex((f) => f.id === floorId);
    if (fIdx < 0) return NextResponse.json({ error: "Étage introuvable." }, { status: 404 });

    const nextInUse = body.inUse !== undefined ? Boolean(body.inUse) : buildings[bIdx].floors[fIdx].inUse;
    if (!nextInUse && roomsOnFloor(rooms, buildingId, floorId).length > 0) {
      return NextResponse.json(
        { error: "Impossible : des chambres sont encore sur cet étage." },
        { status: 400 },
      );
    }

    const label = String(body.label || buildings[bIdx].floors[fIdx].label).trim();
    if (!label) return NextResponse.json({ error: "Nom de l'étage requis." }, { status: 400 });

    const floors = [...buildings[bIdx].floors];
    floors[fIdx] = {
      ...floors[fIdx],
      label,
      inUse: nextInUse,
      sortOrder:
        body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))
          ? Number(body.sortOrder)
          : floors[fIdx].sortOrder,
      notes:
        body.notes !== undefined
          ? String(body.notes || "").trim() || undefined
          : floors[fIdx].notes,
    };
    buildings[bIdx] = {
      ...buildings[bIdx],
      floors: sortInternatFloors(floors),
      updatedAt: now,
    };
    await saveInternatBuildings(buildings);
    return NextResponse.json({ floor: floors[fIdx], building: buildings[bIdx], buildings });
  }

  if (action === "delete_floor") {
    const buildingId = String(body.buildingId || "");
    const floorId = String(body.floorId || "");
    const bIdx = buildings.findIndex((b) => b.id === buildingId);
    if (bIdx < 0) return NextResponse.json({ error: "Bâtiment introuvable." }, { status: 404 });
    if (roomsOnFloor(rooms, buildingId, floorId).length > 0) {
      return NextResponse.json(
        { error: "Impossible : des chambres sont encore sur cet étage." },
        { status: 400 },
      );
    }
    buildings[bIdx] = {
      ...buildings[bIdx],
      floors: buildings[bIdx].floors.filter((f) => f.id !== floorId),
      updatedAt: now,
    };
    await saveInternatBuildings(buildings);
    return NextResponse.json({ building: buildings[bIdx], buildings });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}

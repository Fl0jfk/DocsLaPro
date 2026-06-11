import { NextResponse } from "next/server";
import { getJson, putJson } from "@/app/lib/s3-storage";
import { requireAuth } from "@/app/lib/intranet-auth";
import { requireProfRoomModuleAdmin } from "@/app/lib/prof-room-auth";

const ROOMS_KEY = "reservation-rooms/rooms.json";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    const hit = await getJson<{ rooms?: unknown[] } | unknown[]>( ROOMS_KEY);
    const data = hit?.data;
    const rooms = Array.isArray(data) ? data : (data as { rooms?: unknown[] })?.rooms || [];
    return NextResponse.json({ rooms });
  } catch (err: unknown) {
    console.error("Erreur route /rooms:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur lors du chargement des salles" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const gate = await requireProfRoomModuleAdmin();
  if (!gate.ok) return gate.response;
  try {
    const body = await req.json();
    const rooms = Array.isArray(body?.rooms) ? body.rooms : body;
    if (!Array.isArray(rooms)) {
      return NextResponse.json({ error: "Format invalide : attendu { rooms: [...] }" }, { status: 400 });
    }
    await putJson(ROOMS_KEY, { rooms });
    return NextResponse.json({ success: true, rooms });
  } catch (err: unknown) {
    console.error("PUT /rooms:", err);
    return NextResponse.json({ error: "Impossible d'enregistrer les salles." }, { status: 500 });
  }
}

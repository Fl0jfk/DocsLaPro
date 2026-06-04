import { NextResponse } from "next/server";
import { getTenantJson } from "@/app/lib/tenant-s3-storage";
import { requireTenantAuth } from "@/app/lib/tenant-auth";

const RESERVATIONS_KEY = "reservation-rooms/reservations.json";

export async function GET() {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  try {
    const hit = await getTenantJson<unknown[]>(gate.ctx.orgId, RESERVATIONS_KEY);
    const reservations = Array.isArray(hit?.data) ? hit.data : [];
    return NextResponse.json({ reservations });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}

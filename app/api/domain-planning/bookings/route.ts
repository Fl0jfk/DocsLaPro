import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { loadBookings } from "@/app/lib/domain-planning-storage";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    const bookings = await loadBookings();
    return NextResponse.json({ bookings });
  } catch (err: unknown) {
    console.error("GET /domain-planning/bookings:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}

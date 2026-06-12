import { NextResponse, NextRequest } from "next/server";
import {
  canManageDomainBooking,
  getDomainPlanningUserDisplay,
} from "@/app/lib/domain-planning-auth";
import { loadBookings, saveBookings } from "@/app/lib/domain-planning-storage";
import type { DomainPlanningBooking } from "@/app/lib/domain-planning-types";
import { requireAuth } from "@/app/lib/intranet-auth";

export async function POST(req: NextRequest) {
  try {
    const gate = await requireAuth();
    if (!gate.ok) return gate.response;
    const authUser = await getDomainPlanningUserDisplay();
    const body = await req.json();
    const { id, newHour, date, updateAllSeries, className, activityLabel, comment, firstName, lastName, targetUserId, email } =
      body;

    const existing = await loadBookings();
    const original = existing.find((r) => r.id === id);
    if (!original || original.status === "CANCELLED") {
      return NextResponse.json({ error: "Créneau introuvable." }, { status: 404 });
    }

    if (!(await canManageDomainBooking(original, authUser.userId))) {
      return NextResponse.json({ error: "Modification non autorisée." }, { status: 403 });
    }

    const toUpdate: DomainPlanningBooking[] =
      updateAllSeries && original.groupId
        ? existing.filter((r) => r.groupId === original.groupId && r.status !== "CANCELLED")
        : [original];

    for (const booking of toUpdate) {
      const baseDate = !updateAllSeries && date ? String(date) : booking.startsAt.split("T")[0];
      const tempStart = `${baseDate}T${Number(newHour).toString().padStart(2, "0")}:30:00`;
      const tempEnd = `${baseDate}T${(Number(newHour) + 1).toString().padStart(2, "0")}:30:00`;
      const conflict = existing.some(
        (ext) =>
          !toUpdate.some((u) => u.id === ext.id) &&
          ext.domainId === booking.domainId &&
          ext.status !== "CANCELLED" &&
          ext.startsAt.substring(0, 19) < tempEnd &&
          ext.endsAt.substring(0, 19) > tempStart,
      );
      if (conflict) {
        return NextResponse.json({ error: "Conflit d'horaire détecté." }, { status: 409 });
      }
    }

    for (const booking of toUpdate) {
      const idx = existing.findIndex((r) => r.id === booking.id);
      if (idx === -1) continue;
      const baseDate = !updateAllSeries && date ? String(date) : booking.startsAt.split("T")[0];
      existing[idx].startsAt = `${baseDate}T${Number(newHour).toString().padStart(2, "0")}:30:00`;
      existing[idx].endsAt = `${baseDate}T${(Number(newHour) + 1).toString().padStart(2, "0")}:30:00`;
      if (className) existing[idx].className = String(className).trim();
      if (activityLabel !== undefined) existing[idx].activityLabel = activityLabel?.trim() || undefined;
      if (comment !== undefined) existing[idx].comment = String(comment || "").trim();
      if (firstName?.trim()) existing[idx].firstName = String(firstName).trim();
      if (lastName?.trim()) existing[idx].lastName = String(lastName).trim().toUpperCase();
      if (targetUserId?.trim()) existing[idx].userId = String(targetUserId).trim();
      if (email?.trim()) existing[idx].email = String(email).trim();
    }

    await saveBookings(existing);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

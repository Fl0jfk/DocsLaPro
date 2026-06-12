import { NextResponse, NextRequest } from "next/server";
import {
  canManageDomainBooking,
  getDomainPlanningUserDisplay,
} from "@/app/lib/domain-planning-auth";
import { parseCalendarDateLocal } from "@/app/lib/domain-planning-dates";
import { findDomainById, loadBookings, saveBookings } from "@/app/lib/domain-planning-storage";
import type { DomainPlanningBooking } from "@/app/lib/domain-planning-types";
import { requireAuth } from "@/app/lib/intranet-auth";
import { createTenantTransporter, getTenantSmtpConfig } from "@/app/lib/tenant-mail";

function formatSlotLine(booking: DomainPlanningBooking): string {
  const d = parseCalendarDateLocal(booking.startsAt.split("T")[0]);
  const dateFr = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const hourFr = booking.startsAt.split("T")[1].substring(0, 5).replace(":", "h");
  return `<li>Le ${dateFr} à ${hourFr} — ${booking.className}</li>`;
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireAuth();
    if (!gate.ok) return gate.response;
    const authUser = await getDomainPlanningUserDisplay();
    const { id, groupId, deleteAllSeries, reason } = await req.json();

    const existing = await loadBookings();
    const targetBookings = [];

    if (deleteAllSeries && groupId) {
      for (const r of existing) {
        if (r.groupId === groupId && r.status !== "CANCELLED") {
          if (!(await canManageDomainBooking(r, authUser.userId))) {
            return NextResponse.json({ error: "Annulation non autorisée." }, { status: 403 });
          }
        }
      }
      for (const r of existing) {
        if (r.groupId === groupId && r.status !== "CANCELLED") {
          targetBookings.push(r);
          r.status = "CANCELLED";
          r.cancelledAt = new Date().toISOString();
          r.cancelledBy = `${authUser.firstName} ${authUser.lastName}`;
          r.cancelReason = reason || "Annulation";
        }
      }
    } else {
      const idx = existing.findIndex((r) => r.id === id);
      if (idx === -1) return NextResponse.json({ error: "Créneau introuvable." }, { status: 404 });
      const booking = existing[idx];
      if (!(await canManageDomainBooking(booking, authUser.userId))) {
        return NextResponse.json({ error: "Annulation non autorisée." }, { status: 403 });
      }
      targetBookings.push(booking);
      booking.status = "CANCELLED";
      booking.cancelledAt = new Date().toISOString();
      booking.cancelledBy = `${authUser.firstName} ${authUser.lastName}`;
      booking.cancelReason = reason || "Annulation";
    }

    await saveBookings(existing);

    const primary = targetBookings[0];
    const notifyEmail = primary?.email?.trim();
    if (notifyEmail && targetBookings.length > 0) {
      const domain = await findDomainById(primary.domainId);
      const smtp = await getTenantSmtpConfig();
      const transporter = smtp ? await createTenantTransporter() : null;
      if (transporter && smtp) {
        const slotsList = targetBookings.map(formatSlotLine).join("");
        await transporter.sendMail({
          from: `"Enseignements transversaux" <${smtp.user}>`,
          to: notifyEmail,
          subject: `Annulation — ${domain?.name || "enseignement transversal"}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="color:#dc2626;">Créneau annulé — ${domain?.name || ""}</h2>
              <p>Bonjour ${primary.firstName || ""},</p>
              <p>Votre créneau a été annulé${targetBookings.length > 1 ? " (série)" : ""} :</p>
              <ul>${slotsList}</ul>
              <p>Annulé par : <strong>${authUser.firstName} ${authUser.lastName}</strong></p>
              <p>Motif : ${reason || "Non précisé"}</p>
            </div>
          `,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

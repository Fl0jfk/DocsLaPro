import { NextResponse, NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { getTenantJson, putTenantJson } from "@/app/lib/tenant-s3-storage";
import { loadTenantConfig } from "@/app/lib/tenant-config";

const RESERVATIONS_KEY = "reservation-rooms/reservations.json";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function POST(req: NextRequest) {
  try {
    const gate = await requireTenantAuth();
    if (!gate.ok) return gate.response;
    const { userId, orgId } = gate.ctx;
    const body = await req.json();
    const { roomId, selectedHours, date, subject, className, comment, recurrence, untilDate, firstName, lastName, email } = body;
    const hit = await getTenantJson<unknown[]>(orgId, RESERVATIONS_KEY);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let existing: any[] = Array.isArray(hit?.data) ? hit.data : [];
    const profCfg = (await loadTenantConfig(orgId)).profRoom;
    const ADMIN_LASTNAMES = profCfg.adminLastNames?.length ? profCfg.adminLastNames : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newReservationsAdded: any[] = [];
    const isAdmin = ADMIN_LASTNAMES.includes((lastName || "").toUpperCase());
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + (profCfg.bookingHorizonDays || 56)); 
    const groupId = recurrence !== "none" ? `group-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` : null;
    for (const hour of selectedHours) {
      const currentLoopDate = new Date(`${date}T12:00:00`); 
      const stopDate = (recurrence !== "none" && untilDate) ? new Date(`${untilDate}T23:59:59`) : new Date(`${date}T23:59:59`);
      while (currentLoopDate <= stopDate) {
        if (!isAdmin && currentLoopDate > limitDate) break;
        const dateStr = currentLoopDate.toISOString().split("T")[0];
        const startsAt = `${dateStr}T${hour.toString().padStart(2, "0")}:30:00`;
        const endsAt = `${dateStr}T${(hour + 1).toString().padStart(2, "0")}:30:00`;
        const hasConflict = existing.some(r => 
          r.roomId === roomId && 
          r.status !== "CANCELLED" &&
          r.startsAt.substring(0, 19) < endsAt && 
          r.endsAt.substring(0, 19) > startsAt
        );
        if (!hasConflict) {
          const resObj = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            groupId,
            roomId, 
            userId, 
            firstName, 
            lastName, 
            email, 
            subject, 
            className,
            comment,
            startsAt, 
            endsAt,
            createdAt: new Date().toISOString(),
            status: "CONFIRMED",
          };
          newReservationsAdded.push(resObj);
          existing.push(resObj);
        }
        if (recurrence === "weekly") {
          currentLoopDate.setDate(currentLoopDate.getDate() + 7);
        } else if (recurrence === "biweekly") {
          currentLoopDate.setDate(currentLoopDate.getDate() + 14);
        } else {
          break;
        }
      }
    }
    if (newReservationsAdded.length === 0) return NextResponse.json({ error: "Aucun créneau disponible." }, { status: 409 });
    await putTenantJson(orgId, RESERVATIONS_KEY, existing);
    if (email) {
      const datesList = newReservationsAdded.map(r => {
        const d = new Date(r.startsAt);
        const dateFr = d.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });
        const hourFr = r.startsAt.split("T")[1].substring(0, 5).replace(':', 'h');
        return `<li>Le ${dateFr} à ${hourFr}</li>`;
      }).join("");
      await transporter.sendMail({
        from: `"Gestion Salles" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "✅ Confirmation de réservation - Système de Gestion",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Réservation Confirmée</h1>
            </div>
            <div style="padding: 30px;">
              <p>Bonjour,</p>
              <p>Vos créneaux ont été enregistrés pour la salle <strong>${roomId}</strong> :</p>
              <ul>${datesList}</ul>
              <p>Matière : ${subject} (${className})</p>
            </div>
          </div>
        `
      });
    }
    return NextResponse.json({ success: true, count: newReservationsAdded.length }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
import { NextResponse, NextRequest } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuth } from "@clerk/nextjs/server";
import nodemailer from "nodemailer";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: { accessKeyId: process.env.ACCESS_KEY_ID!, secretAccessKey: process.env.SECRET_ACCESS_KEY! },
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const ADMIN_LASTNAMES = ["HACQUEVILLE-MATHI", "FORTINEAU", "DONA", "DUMOUCHEL", "PLANTEC", "GUEDIN", "LAINE"];

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const body = await req.json();
    const { roomId, selectedHours, date, subject, className, comment, recurrence, untilDate, firstName, lastName, email } = body;
    const getCmd = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: "reservation-rooms/reservations.json" });
    const getUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 });
    const resS3 = await fetch(getUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let existing: any[] = [];
    if (resS3.ok) {
      const text = await resS3.text();
      existing = text ? JSON.parse(text) : [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newReservationsAdded: any[] = [];
    const isAdmin = ADMIN_LASTNAMES.includes((lastName || "").toUpperCase());
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 56); 
    const groupId = recurrence !== "none" ? `group-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` : null;
    for (const hour of selectedHours) {
      const currentStart = new Date(new Date(`${date}T${hour.toString().padStart(2, "0")}:30:00`).toLocaleString("en-US", { timeZone: "Europe/Paris" }));
      const currentEnd = new Date(currentStart.getTime() + 60 * 60 * 1000);
      let stopDate = new Date(currentStart);
      if (recurrence !== "none" && untilDate) {
        stopDate = new Date(new Date(`${untilDate}T23:59:59`).toLocaleString("en-US", { timeZone: "Europe/Paris" }));
      }
      while (currentStart <= stopDate) {
        if (!isAdmin && currentStart > limitDate) break;
        const hasConflict = existing.some(r => 
          r.roomId === roomId && r.status !== "CANCELLED" &&
          new Date(r.startsAt) < currentEnd && new Date(r.endsAt) > currentStart
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
            startsAt: currentStart.toISOString(),
            endsAt: currentEnd.toISOString(),
            createdAt: new Date().toISOString(),
            status: "CONFIRMED",
          };
          newReservationsAdded.push(resObj);
          existing.push(resObj);
        }
        if (recurrence === "weekly") {
          currentStart.setDate(currentStart.getDate() + 7);
          currentEnd.setDate(currentEnd.getDate() + 7);
        } else if (recurrence === "biweekly") {
          currentStart.setDate(currentStart.getDate() + 14);
          currentEnd.setDate(currentEnd.getDate() + 14);
        } else break;
      }
    }
    if (newReservationsAdded.length === 0) return NextResponse.json({ error: "Aucun créneau disponible." }, { status: 409 });
    const putCmd = new PutObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: "reservation-rooms/reservations.json", ContentType: "application/json" });
    const putUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 });
    await fetch(putUrl, { method: "PUT", body: JSON.stringify(existing, null, 2) });
    if (email) {
      const datesList = newReservationsAdded.map(r => {
        const d = new Date(r.startsAt);
        const dateFr = d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: 'long', day: 'numeric', month: 'long' });
        const hourFr = d.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
        return `<li>Le ${dateFr} à ${hourFr}</li>`;
      }).join("");

      await transporter.sendMail({
        from: `"Gestion Salles" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "✅ Confirmation de réservation - Système de Gestion",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Réservation Confirmée</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
              <p style="font-size: 16px; margin-top: 0;">Bonjour,</p>
              <p style="font-size: 15px;">Nous vous confirmons que vos créneaux ont été correctement enregistrés dans le système pour la salle :</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 5px 0;"><strong>📍 Salle :</strong> ${roomId}</p>
                <p style="margin: 5px 0;"><strong>📚 Matière :</strong> ${subject}</p>
                <p style="margin: 5px 0;"><strong>👥 Classe :</strong> ${className}</p>
              </div>
              <p style="font-size: 15px; font-weight: bold; color: #2563eb;">Dates et horaires réservés :</p>
              <ul style="background-color: #f1f5f9; padding: 15px 15px 15px 35px; border-radius: 8px; font-size: 14px; list-style-type: square;">
                ${datesList}
              </ul>
              <p style="font-size: 14px; color: #64748b; margin-top: 25px;">
                Si vous avez besoin de modifier ou d'annuler ces réservations, merci de vous rendre directement sur l'application.
              </p>
            </div>
            <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #334155;">Bonne journée,</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">Système de Gestion de Salles Automatisé</p>
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
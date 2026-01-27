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
    const { roomId, selectedHours, date, subject, className, recurrence, untilDate, firstName, lastName, email } = body;
    
    const getCmd = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: "reservation-rooms/reservations.json" });
    const getUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 });
    const resS3 = await fetch(getUrl);
    
    let existing: any[] = [];
    if (resS3.ok) {
      const text = await resS3.text();
      existing = text ? JSON.parse(text) : [];
    }

    const newReservationsAdded: any[] = [];
    const isAdmin = ADMIN_LASTNAMES.includes((lastName || "").toUpperCase());
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 56); 

    // Création d'un ID de groupe unique pour la série
    const groupId = recurrence !== "none" ? `group-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` : null;

    for (const hour of selectedHours) {
      const currentStart = new Date(`${date}T${hour.toString().padStart(2, "0")}:30:00`);
      const currentEnd = new Date(currentStart.getTime() + 60 * 60 * 1000);
      let stopDate = new Date(currentStart);
      
      if (recurrence !== "none" && untilDate) {
        stopDate = new Date(untilDate);
        stopDate.setHours(23, 59, 59, 999); 
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
            groupId, // Liaison de la série
            roomId, userId, firstName, lastName, email, subject, className,
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
      const datesList = newReservationsAdded.map(r => 
        `<li>Le ${new Date(r.startsAt).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' })} à ${new Date(r.startsAt).getHours()}h30</li>`
      ).join("");
      await transporter.sendMail({
        from: `"Gestion Salles" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "✅ Confirmation de réservation",
        html: `<p>Bonjour,</p><p>Réservations confirmées pour <b>${roomId}</b> (${subject} - ${className}) :</p><ul>${datesList}</ul>`
      });
    }

    return NextResponse.json({ success: true, count: newReservationsAdded.length }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
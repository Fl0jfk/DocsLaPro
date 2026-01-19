import { NextResponse, NextRequest } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import nodemailer from "nodemailer";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const { roomId, startsAt, endsAt, purpose, firstName, lastName, email } = await req.json();
    if (!roomId || !startsAt || !endsAt) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (start >= end) return NextResponse.json({ error: "Plage horaire invalide" }, { status: 400 });
    const getCmd = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: "reservation-rooms/reservations.json",
    });
    const getUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 });
    const res = await fetch(getUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let existing: any[] = [];
    if (res.ok) {
      const text = await res.text();
      existing = text ? JSON.parse(text) : [];
    }
    const conflict = existing.find(
      (r) =>
        r.roomId === roomId &&
        r.status !== "CANCELLED" &&
        new Date(r.startsAt) < end &&
        new Date(r.endsAt) > start
    );
    if (conflict) return NextResponse.json({ error: "Ce créneau est déjà réservé" }, { status: 409 });
    const newReservation = {
      id: Date.now().toString(),
      roomId,
      userId,
      firstName: firstName || user.firstName || "",
      lastName: lastName || user.lastName || "",
      email: email || user.primaryEmailAddress?.emailAddress || "",
      startsAt,
      endsAt,
      purpose: purpose || "",
      createdAt: new Date().toISOString(),
      status: "CONFIRMED",
    };
    existing.push(newReservation);
    const putCmd = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: "reservation-rooms/reservations.json",
      ContentType: "application/json",
    });
    const putUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 });
    const putRes = await fetch(putUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(existing, null, 2),
    });
    if (!putRes.ok) throw new Error("Impossible de sauvegarder sur S3");
    const targetEmail = newReservation.email;
    if (targetEmail) {
      const dateFormatted = new Date(startsAt).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'});
      try {
        await transporter.sendMail({
          from: `"Gestion Salles - La Providence" <${process.env.SMTP_USER}>`,
          to: targetEmail,
          subject: "✅ Confirmation de votre réservation de salle",
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #2e7d32;">Réservation confirmée !</h2>
              <p>Bonjour <strong>${newReservation.firstName}</strong>,</p>
              <p>Nous vous confirmons la réservation de la salle suivante :</p>
              <ul style="list-style: none; padding: 0;">
                <li><strong>📍 Salle :</strong> ${roomId}</li>
                <li><strong>📅 Date :</strong> ${dateFormatted}</li>
              </ul>
              <p style="margin-top: 20px;">Merci d'utiliser notre plateforme de gestion.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 0.8em; color: #888;">Ceci est un message automatique de l'Institution La Providence.</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error("Erreur lors de l'envoi du mail de confirmation:", mailErr);
      }
    }
    return NextResponse.json({ reservation: newReservation }, { status: 201 });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Erreur POST réservation :", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
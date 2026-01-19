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
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const lastNameAdmin = (user.lastName ?? "").toUpperCase();
    const ADMIN_LASTNAMES = ["HACQUEVILLE-MATHI","FORTINEAU","DONA","DUMOUCHEL","PLANTEC","GUEDIN","LAINE"];
    const firstNameAdmin = user.firstName ?? "";
    if (!ADMIN_LASTNAMES.includes(lastNameAdmin)) {  return NextResponse.json({ error: "Non autorisé" }, { status: 403 })}
    const { startsAt, reason, userEmail } = await req.json();
    if (!startsAt) return NextResponse.json({ error: "startsAt manquant" }, { status: 400 });
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
    const index = existing.findIndex((r) => r.startsAt === startsAt);
    if (index === -1) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }
    const reservationToCancel = existing[index];
    existing[index].status = "CANCELLED";
    existing[index].cancelledAt = new Date().toISOString();
    existing[index].cancelledBy = `${firstNameAdmin} ${lastNameAdmin}`;
    existing[index].cancelReason = reason || "Non spécifié";
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
    if (!putRes.ok) throw new Error("Erreur S3");
    const targetEmail = userEmail || reservationToCancel.email;
    if (targetEmail) {
      const dateFormatted = new Date(startsAt).toLocaleDateString("fr-FR", {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
      });
      await transporter.sendMail({
        from: `"Gestion Salles - La Providence" <${process.env.SMTP_USER}>`,
        to: targetEmail,
        subject: "⚠️ Annulation de votre réservation de salle",
        html: `
          <div style="font-family: sans-serif; line-height: 1.5;">
            <p>Bonjour ${reservationToCancel.firstName},</p>
            <p>Votre réservation pour le <strong>${dateFormatted}</strong> a été annulée par l'administration.</p>
            <p><strong>Motif :</strong> ${reason || "Aucun motif précisé."}</p>
            <p><strong>Annulé par :</strong> ${firstNameAdmin} ${lastNameAdmin}</p>
            <hr />
            <p style="font-size: 0.9em; color: #666;">Ceci est un message automatique, merci de ne pas y répondre directement.</p>
          </div>
        `,
      });
    }
    return NextResponse.json({ success: true, message: "Annulation effectuée et mail envoyé" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Erreur API :", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
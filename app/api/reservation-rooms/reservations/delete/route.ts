import { NextResponse, NextRequest } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import nodemailer from "nodemailer";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: { accessKeyId: process.env.ACCESS_KEY_ID!, secretAccessKey: process.env.SECRET_ACCESS_KEY! },
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const lastNameAdmin = (user.lastName ?? "").toUpperCase();
    const firstNameAdmin = user.firstName ?? "";
    const { id, groupId, deleteAllSeries, reason, userEmail, startsAt } = await req.json();
    const getCmd = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: "reservation-rooms/reservations.json" });
    const getUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 });
    const resS3 = await fetch(getUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let existing: any[] = [];
    if (resS3.ok) existing = await resS3.json();
    const targetReservations = [];
    if (deleteAllSeries && groupId) {
      existing = existing.map(r => {
        if (r.groupId === groupId && r.status !== "CANCELLED") {
          targetReservations.push(r);
          return { ...r, status: "CANCELLED", cancelledAt: new Date().toISOString(), cancelledBy: `${firstNameAdmin} ${lastNameAdmin}`, cancelReason: reason };
        }
        return r;
      });
    } else {
      const index = existing.findIndex(r => r.id === id);
      if (index !== -1) {
        targetReservations.push(existing[index]);
        existing[index].status = "CANCELLED";
        existing[index].cancelledAt = new Date().toISOString();
        existing[index].cancelledBy = `${firstNameAdmin} ${lastNameAdmin}`;
        existing[index].cancelReason = reason;
      }
    }
    const putCmd = new PutObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: "reservation-rooms/reservations.json", ContentType: "application/json" });
    const putUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 });
    await fetch(putUrl, { method: "PUT", body: JSON.stringify(existing, null, 2) });
    if (userEmail && targetReservations.length > 0) {
      const dateFormatted = new Date(startsAt).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });
      await transporter.sendMail({
        from: `"Gestion Salles" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: "⚠️ Annulation de réservation",
        html: `<p>Bonjour,</p><p>Votre réservation (ou série) débutant le ${dateFormatted} a été annulée.</p><p><b>Motif :</b> ${reason}</p>`
      });
    }
    return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
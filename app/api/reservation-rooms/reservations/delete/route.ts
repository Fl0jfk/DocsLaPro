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
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(90deg, #dc2626 0%, #ea580c 100%); padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Avis d'annulation</h1>
            </div>

            <div style="padding: 30px; background-color: #ffffff;">
              <p style="font-size: 16px; margin-top: 0;">Bonjour,</p>
              <p style="font-size: 15px;">Nous vous informons qu'une réservation (ou série de réservations) a été <strong>annulée</strong> dans le système.</p>
              
              <div style="background-color: #fffafb; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 5px 0; font-size: 14px;"><strong>📅 Date concernée :</strong> ${dateFormatted}</p>
                <p style="margin: 5px 0; font-size: 14px; color: #dc2626;"><strong>📝 Motif de l'annulation :</strong> ${reason}</p>
              </div>

              <p style="font-size: 14px; color: #64748b; margin-top: 25px; font-style: italic;">
                Le créneau a été libéré et est désormais disponible pour d'autres utilisateurs.
              </p>
            </div>

            <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #fee2e2;">
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #475569;">L'équipe de gestion</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">Plateforme de réservation de salles</p>
            </div>
          </div>
        `
      });
    }
    return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
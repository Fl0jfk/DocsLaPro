import { NextResponse, NextRequest } from "next/server";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuth } from "@clerk/nextjs/server";
import { getClerkClientForTenant } from "@/app/lib/tenant-clerk";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getBucketName } from "@/app/lib/s3-storage";
import {
  createTenantTransporter,
  getTenantSmtpConfig,
} from "@/app/lib/tenant-mail";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const clerk = await getClerkClientForTenant();
    const user = await clerk.users.getUser(userId);
    const lastNameAdmin = (user.lastName ?? "").toUpperCase();
    const firstNameAdmin = user.firstName ?? "";
    const { id, groupId, deleteAllSeries, reason, userEmail, startsAt } = await req.json();
    const bucket = await getBucketName();
    const s3 = await getTenantDataS3Client();
    const getCmd = new GetObjectCommand({ Bucket: bucket, Key: "reservation-rooms/reservations.json" });
    const getUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 });
    const resS3 = await fetch(getUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let existing: any[] = [];
    if (resS3.ok) existing = await resS3.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetReservations: any[] = [];

    if (deleteAllSeries && groupId) {
      existing = existing.map(r => {
        if (r.groupId === groupId && r.status !== "CANCELLED") {
          targetReservations.push(r);
          return { 
            ...r, 
            status: "CANCELLED", 
            cancelledAt: new Date().toISOString(), 
            cancelledBy: `${firstNameAdmin} ${lastNameAdmin}`, 
            cancelReason: reason 
          };
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
    const putCmd = new PutObjectCommand({ 
        Bucket: bucket, 
        Key: "reservation-rooms/reservations.json", 
        ContentType: "application/json" 
    });
    const putUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 });
    await fetch(putUrl, { method: "PUT", body: JSON.stringify(existing, null, 2) });
    if (userEmail && targetReservations.length > 0) {
      const smtp = await getTenantSmtpConfig();
      const transporter = smtp ? await createTenantTransporter() : null;
      if (transporter && smtp) {
      const dateFormatted = new Date(startsAt.split('T')[0] + "T12:00:00").toLocaleDateString("fr-FR", { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      });
      const hourFormatted = startsAt.includes('T') 
        ? startsAt.split('T')[1].substring(0, 5).replace(':', 'h') 
        : "";
      await transporter.sendMail({
        from: `"Gestion Salles" <${smtp.user}>`,
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
                <p style="margin: 5px 0; font-size: 14px;"><strong>📅 Date concernée :</strong> ${dateFormatted} ${hourFormatted ? `à ${hourFormatted}` : ""}</p>
                <p style="margin: 5px 0; font-size: 14px; color: #dc2626;"><strong>📝 Motif :</strong> ${reason}</p>
                <p style="margin: 5px 0; font-size: 12px; color: #64748b;"><strong>🚫 Annulé par :</strong> ${firstNameAdmin} ${lastNameAdmin}</p>
              </div>

            </div>

            <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #fee2e2;">
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #475569;">L'équipe de gestion</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">Plateforme de réservation de salles</p>
            </div>
          </div>
        `
      });
      }
    }
    return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
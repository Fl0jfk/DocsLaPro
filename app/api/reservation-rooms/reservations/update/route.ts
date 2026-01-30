import { NextResponse, NextRequest } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuth } from "@clerk/nextjs/server";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: { accessKeyId: process.env.ACCESS_KEY_ID!, secretAccessKey: process.env.SECRET_ACCESS_KEY! },
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const body = await req.json();
    const { id, newHour, date, updateAllSeries, subject, className, comment } = body;
    const getCmd = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: "reservation-rooms/reservations.json" });
    const getUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 });
    const resS3 = await fetch(getUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any[] = await resS3.json();
    const originalRes = existing.find(r => r.id === id);
    if (!originalRes) throw new Error("Réservation introuvable");
    const reservationsToUpdate = (updateAllSeries && originalRes.groupId) 
        ? existing.filter(r => r.groupId === originalRes.groupId && r.status !== "CANCELLED") 
        : [originalRes];
    for (const res of reservationsToUpdate) {
        const baseDate = (!updateAllSeries && date) ? date : res.startsAt.split('T')[0];
        const tempStart = `${baseDate}T${newHour.toString().padStart(2, "0")}:30:00`;
        const tempEnd = `${baseDate}T${(newHour + 1).toString().padStart(2, "0")}:30:00`;
        const conflict = existing.some(ext => 
            !reservationsToUpdate.some(u => u.id === ext.id) && 
            ext.roomId === res.roomId && 
            ext.status !== "CANCELLED" &&
            ext.startsAt.substring(0, 19) < tempEnd && 
            ext.endsAt.substring(0, 19) > tempStart
        );
        if (conflict) {
            return NextResponse.json({ error: `Conflit d'horaire détecté pour un des créneaux.`}, { status: 409 });
        }
    }
    reservationsToUpdate.forEach(res => {
        const idx = existing.findIndex(r => r.id === res.id);
        if (idx !== -1) {
            const baseDate = (!updateAllSeries && date) ? date : res.startsAt.split('T')[0];
            existing[idx].startsAt = `${baseDate}T${newHour.toString().padStart(2, "0")}:30:00`;
            existing[idx].endsAt = `${baseDate}T${(newHour + 1).toString().padStart(2, "0")}:30:00`;
            if (subject) existing[idx].subject = subject;
            if (className) existing[idx].className = className;
            if (comment !== undefined) existing[idx].comment = comment;
        }
    });
    const putCmd = new PutObjectCommand({ 
        Bucket: process.env.BUCKET_NAME!, 
        Key: "reservation-rooms/reservations.json", 
        ContentType: "application/json" 
    });
    const putUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 });
    await fetch(putUrl, { method: "PUT", body: JSON.stringify(existing, null, 2) });
    return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
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
    const { id, newHour, date, updateAllSeries, subject, className, comment } = await req.json();
    const getCmd = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: "reservation-rooms/reservations.json" });
    const getUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 });
    const resS3 = await fetch(getUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any[] = await resS3.json();
    const index = existing.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Réservation introuvable");
    const originalRes = existing[index];
    const reservationsToUpdate = (updateAllSeries && originalRes.groupId) ? existing.filter(r => r.groupId === originalRes.groupId && r.status !== "CANCELLED") : [originalRes];
    for (const res of reservationsToUpdate) {
        const baseDate = (!updateAllSeries && date) ? date : res.startsAt.split("T")[0];
        const tempStart = new Date(`${baseDate}T${newHour.toString().padStart(2, "0")}:30:00`);
        const tempEnd = new Date(tempStart.getTime() + 60 * 60 * 1000);
        const conflict = existing.some(ext => 
            !reservationsToUpdate.find(u => u.id === ext.id) && 
            ext.roomId === res.roomId && 
            ext.status !== "CANCELLED" &&
            new Date(ext.startsAt) < tempEnd && new Date(ext.endsAt) > tempStart
        );
        if (conflict) { 
            return NextResponse.json({ error: `Conflit d'horaire détecté pour la date du ${new Date(tempStart).toLocaleDateString()}`}, { status: 409 })
        }
    }
    reservationsToUpdate.forEach(res => {
        const resIndex = existing.findIndex(r => r.id === res.id);
        if (resIndex !== -1) {
            const baseDate = (!updateAllSeries && date) ? date : existing[resIndex].startsAt.split("T")[0];
            const newStart = new Date(`${baseDate}T${newHour.toString().padStart(2, "0")}:30:00`);
            const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
            existing[resIndex].startsAt = newStart.toISOString();
            existing[resIndex].endsAt = newEnd.toISOString();
            if (subject) existing[resIndex].subject = subject;
            if (className) existing[resIndex].className = className;
            if (comment !== undefined) existing[resIndex].comment = comment;
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
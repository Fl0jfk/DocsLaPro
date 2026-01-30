import { NextResponse, NextRequest } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuth } from "@clerk/nextjs/server";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: { 
    accessKeyId: process.env.ACCESS_KEY_ID!, 
    secretAccessKey: process.env.SECRET_ACCESS_KEY! 
  },
});

const ADMIN_LASTNAMES = ["HACQUEVILLE-MATHI", "FORTINEAU", "DONA", "DUMOUCHEL", "PLANTEC", "GUEDIN", "LAINE"];

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = getAuth(req);
    const userLastName = (sessionClaims?.lastName as string) || "";
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const { id, newHour, date, updateAllSeries, subject, className, comment } = await req.json();
    const getCmd = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: "reservation-rooms/reservations.json" });
    const getUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 });
    const resS3 = await fetch(getUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any[] = await resS3.json();
    const index = existing.findIndex(r => r.id === id);
    if (index === -1) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    const originalRes = existing[index];
    const isAdmin = ADMIN_LASTNAMES.includes(userLastName.toUpperCase());
    if (!isAdmin && originalRes.userId !== userId) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }
    const reservationsToUpdate = (updateAllSeries && originalRes.groupId)  ? existing.filter(r => r.groupId === originalRes.groupId && r.status !== "CANCELLED") : [originalRes];
    for (const res of reservationsToUpdate) {
        const baseDate = (!updateAllSeries && date) 
            ? date 
            : new Date(res.startsAt).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
        const dateString = `${baseDate}T${newHour.toString().padStart(2, "0")}:30:00`;
        const tempStart = new Date(new Date(dateString).toLocaleString("en-US", { timeZone: "Europe/Paris" }));
        const tempEnd = new Date(tempStart.getTime() + 60 * 60 * 1000);
        const conflict = existing.some(ext => 
            !reservationsToUpdate.find(u => u.id === ext.id) && 
            ext.roomId === res.roomId && 
            ext.status !== "CANCELLED" &&
            new Date(ext.startsAt) < tempEnd && new Date(ext.endsAt) > tempStart
        );
        if (conflict) { 
            const dateFr = tempStart.toLocaleDateString('fr-FR');
            return NextResponse.json({ error: `Conflit d'horaire détecté pour le ${dateFr}`}, { status: 409 });
        }
    }
    reservationsToUpdate.forEach(res => {
        const resIndex = existing.findIndex(r => r.id === res.id);
        if (resIndex !== -1) {
            const baseDate = (!updateAllSeries && date)  ? date  : new Date(existing[resIndex].startsAt).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
            const dateString = `${baseDate}T${newHour.toString().padStart(2, "0")}:30:00`;
            const newStart = new Date(new Date(dateString).toLocaleString("en-US", { timeZone: "Europe/Paris" }));
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

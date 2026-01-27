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
    const { id, newHour } = await req.json();
    const getCmd = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: "reservation-rooms/reservations.json" });
    const getUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 });
    const resS3 = await fetch(getUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any[] = await resS3.json();
    const index = existing.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Réservation introuvable");
    const res = existing[index];
    const newStart = new Date(res.startsAt);
    newStart.setHours(newHour, 30, 0, 0);
    const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
    const conflict = existing.some(r => 
      r.id !== id && r.roomId === res.roomId && r.status !== "CANCELLED" &&
      new Date(r.startsAt) < newEnd && new Date(r.endsAt) > newStart
    );
    if (conflict) return NextResponse.json({ error: "Conflit d'horaire" }, { status: 409 });
    existing[index].startsAt = newStart.toISOString();
    existing[index].endsAt = newEnd.toISOString();
    const putCmd = new PutObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: "reservation-rooms/reservations.json", ContentType: "application/json" });
    const putUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 });
    await fetch(putUrl, { method: "PUT", body: JSON.stringify(existing, null, 2) });
    return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
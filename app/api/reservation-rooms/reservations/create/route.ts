import { NextResponse, NextRequest } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const { roomId, startsAt, endsAt, purpose, firstName, lastName, email } = await req.json();
    if (!roomId || !startsAt || !endsAt)
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (start >= end)
      return NextResponse.json({ error: "Plage horaire invalide" }, { status: 400 });
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
    if (conflict)
      return NextResponse.json({ error: "Ce créneau est déjà réservé" }, { status: 409 });
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
    if (!putRes.ok) throw new Error("Impossible de sauvegarder la réservation sur S3");
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

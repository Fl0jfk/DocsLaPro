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
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const ADMIN_LASTNAMES = ["Hacqueville-Mathi", "Dupont", "Martin"];
    const lastName = user.lastName ?? "";
    if (!ADMIN_LASTNAMES.includes(lastName)) {
      return NextResponse.json(
        { error: "Non autorisé (nom incorrect)" },
        { status: 403 }
      );
    }
    const { startsAt } = await req.json();
    if (!startsAt)  return NextResponse.json({ error: "startAt manquant" }, { status: 400 });
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
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }
    existing[index].status = "CANCELLED";
    existing[index].cancelledAt = new Date().toISOString();
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
    if (!putRes.ok) throw new Error("Impossible de sauvegarder la modification sur S3");
    return NextResponse.json(
      { success: true, message: "Réservation annulée" },
      { status: 200 }
    );
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Erreur DELETE réservation :", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

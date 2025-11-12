import { NextResponse, NextRequest } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { Readable } from "stream";

const s3 = new S3Client({ region: process.env.REGION });

// Fonction robuste pour convertir un flux S3 en string
async function streamToString(stream: Readable | undefined): Promise<string> {
  if (!stream) return "";

  return await new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chunks: any[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const roles = (user.publicMetadata?.roles || []) as string[];
    const isAdmin = roles.includes("admin-room");
    const { roomId, startsAt, endsAt, purpose } = await req.json();
    if (!roomId || !startsAt || !endsAt) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (start >= end) {
      return NextResponse.json({ error: "Plage horaire invalide" }, { status: 400 });
    }
    const getCmd = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: process.env.S3_RES_KEY,
    });
    const data = await s3.send(getCmd);
    const bodyStr = await streamToString(data.Body as Readable | undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any[] = JSON.parse(bodyStr || "[]");
    const conflict = existing.find(
      (r) =>
        r.roomId === roomId &&
        r.status !== "CANCELLED" &&
        new Date(r.startsAt) < end &&
        new Date(r.endsAt) > start
    );
    if (conflict) {
      return NextResponse.json({ error: "Créneau déjà pris" }, { status: 409 });
    }

    // Créer la nouvelle réservation
    const newR = {
      id: Date.now().toString(),
      roomId,
      userId,
      userName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      startsAt,
      endsAt,
      purpose: purpose || "",
      createdAt: new Date().toISOString(),
      status: isAdmin ? "CONFIRMED" : "PENDING",
    };
    existing.push(newR);
    const putCmd = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: process.env.S3_RES_KEY,
      Body: JSON.stringify(existing, null, 2),
      ContentType: "application/json",
    });
    await s3.send(putCmd);

    return NextResponse.json({ reservation: newR }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

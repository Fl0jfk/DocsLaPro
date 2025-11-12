import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: "reservation-rooms/rooms.json",
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Impossible de récupérer rooms.json depuis S3");
    }
    const data = await response.json();
    const rooms = Array.isArray(data) ? data : data.rooms || [];
    return NextResponse.json({ rooms });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Erreur route /rooms:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur lors du chargement des salles" },
      { status: 500 }
    );
  }
}

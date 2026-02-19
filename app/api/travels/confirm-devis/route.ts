import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: Request) {
  try {
    const { tripId, providerName, providerEmail, fileUrl } = await req.json();
    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });
    const fileKey = fileUrl.split('.amazonaws.com/')[1];
    const getCommandForSignedUrl = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
    });
    const signedUrl = await getSignedUrl(s3Client, getCommandForSignedUrl, { expiresIn: 604800 });
    const KEY = `travels/${tripId}.json`;
    let tripData;
    try {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: KEY,
      });
      const res = await s3Client.send(getCommand);
      const bodyContents = await res.Body?.transformToString();
      tripData = JSON.parse(bodyContents || "{}");
    } catch (e) {
      return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
    }
    if (!tripData.receivedDevis) { tripData.receivedDevis = [];}
    const newDevis = {
      id: Date.now().toString(),
      providerName,
      fileUrl: signedUrl,
      providerEmail: providerEmail,
      createdAt: new Date().toISOString(),
    };
    tripData.receivedDevis.push(newDevis);
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: KEY,
      Body: JSON.stringify(tripData),
      ContentType: "application/json",
    }));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur confirmation devis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
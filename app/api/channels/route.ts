import { NextRequest } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuth } from "@clerk/nextjs/server";

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: { 
    accessKeyId: process.env.ACCESS_KEY_ID!, 
    secretAccessKey: process.env.SECRET_ACCESS_KEY! 
  },
});

const BUCKET = process.env.BUCKET_NAME!;
const FILE_KEY = "channels/channels.json";

export async function GET() {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: FILE_KEY });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    const s3Res = await fetch(url);
    if (!s3Res.ok) { return new Response(JSON.stringify([{ id: "general", name: "Général", type: "public" }]), { status: 200 })}
    const data = await s3Res.json();
    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erreur GET Channels:", error);
    return new Response(JSON.stringify([{ id: "general", name: "Général" }]), { status: 200 });
  }
}
export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Non autorisé", { status: 401 });
  try {
    const body = await req.json();
    const getCommand = new GetObjectCommand({ Bucket: BUCKET, Key: FILE_KEY });
    const url = await getSignedUrl(s3, getCommand, { expiresIn: 60 });
    let channels = [];
    try {
      const res = await fetch(url);
      if (res.ok) channels = await res.json();
      else channels = [{ id: "general", name: "Général", type: "public" }];
    } catch (e) { 
      console.log(e);
      channels = [{ id: "general", name: "Général", type: "public"}]
    }
    const newChan = {
      id: body.name.toLowerCase().trim().replace(/\s+/g, '-'),
      name: body.name,
      type: body.type || "public",
      members: body.members || [],
      creatorId: body.creatorId || userId 
    };
    channels.push(newChan);
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: FILE_KEY,
      Body: JSON.stringify(channels, null, 2),
      ContentType: "application/json"
    }));
    return new Response(JSON.stringify(newChan), { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
export async function PATCH(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Non autorisé", { status: 401 });
  try {
    const { channelId, members } = await req.json();
    const getCommand = new GetObjectCommand({ Bucket: BUCKET, Key: FILE_KEY });
    const url = await getSignedUrl(s3, getCommand, { expiresIn: 60 });
    const res = await fetch(url);
    if (!res.ok) return new Response("Fichier introuvable", { status: 404 });
    const channels = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelIndex = channels.findIndex((c: any) => c.id === channelId);
    if (channelIndex === -1) return new Response("Salon introuvable", { status: 404 });
    if (channels[channelIndex].creatorId !== userId) { return new Response("Seul le créateur peut modifier ce salon", { status: 403 })}
    channels[channelIndex].members = members || [];
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: FILE_KEY,
      Body: JSON.stringify(channels, null, 2),
      ContentType: "application/json"
    }));
    return new Response(JSON.stringify(channels[channelIndex]), { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
export async function DELETE(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Non autorisé", { status: 401 });
  const { searchParams } = new URL(req.url);
  const idToDelete = searchParams.get("id");
  if (!idToDelete || idToDelete === "general") { return new Response("Action impossible sur ce salon", { status: 400 })}
  try {
    const getCommand = new GetObjectCommand({ Bucket: BUCKET, Key: FILE_KEY });
    const url = await getSignedUrl(s3, getCommand, { expiresIn: 60 });
    const res = await fetch(url);
    if (!res.ok) return new Response("Fichier introuvable", { status: 404 });
    let channels = await res.json();
    const initialLength = channels.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channels = channels.filter((c: any) => c.id !== idToDelete);
    if (channels.length === initialLength) { return new Response("Salon non trouvé", { status: 404 })}
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: FILE_KEY,
      Body: JSON.stringify(channels, null, 2),
      ContentType: "application/json"
    }));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
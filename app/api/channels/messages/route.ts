import { NextRequest } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: { 
    accessKeyId: process.env.ACCESS_KEY_ID!, 
    secretAccessKey: process.env.SECRET_ACCESS_KEY! 
  },
});
const BUCKET = process.env.BUCKET_NAME!;
const FILE_KEY = "chat/messages.json";
async function readMessagesFromS3(shouldSign: boolean = true) {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: FILE_KEY });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    const res = await fetch(url);
    if (!res.ok) return []; 
    const messages = await res.json();
    if (!shouldSign) return messages;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signedMessages = await Promise.all(messages.map(async (m: any) => {
      if (m.content.includes("[IMG]") || m.content.includes("[DOC]")) {
        try {
          const isImg = m.content.startsWith("[IMG]");
          let fileUrl = "";
          let fileName = "";
          if (isImg) {
            fileUrl = m.content.replace("[IMG]", "");
          } else {
            const parts = m.content.split("|");
            fileName = parts[0]; 
            fileUrl = parts[1];
          }
          const fileKey = fileUrl.split(`${BUCKET}.s3.eu-west-3.amazonaws.com/`)[1];
          if (fileKey) {
            const getObj = new GetObjectCommand({ Bucket: BUCKET, Key: fileKey });
            const signedUrl = await getSignedUrl(s3, getObj, { expiresIn: 3600 });
            m.content = isImg ? `[IMG]${signedUrl}` : `${fileName}|${signedUrl}`;
          }
        } catch (err) {
          console.error("Erreur de signature individuelle:", err);
        }
      }
      return m;
    }));
    return signedMessages;
  } catch (e) {
    console.error("Erreur lecture messages S3:", e);
    return [];
  }
}
export async function GET() {
  const messages = await readMessagesFromS3(true);
  return new Response(JSON.stringify(messages), { 
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Non autorisé", { status: 401 });
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const body = await req.json();
    const messages = await readMessagesFromS3(false);
    const newMessage = {
      id: Date.now(),
      channel: body.channel,
      content: body.content,
      createdAt: new Date().toISOString(),
      authorName: body.isAnonymous ? "Anonyme" : `${user.firstName} ${user.lastName}`,
      authorId: body.isAnonymous ? null : userId, 
      avatar: body.isAnonymous ? null : user.imageUrl
    };
    messages.push(newMessage);
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: FILE_KEY,
      Body: JSON.stringify(messages, null, 2),
      ContentType: "application/json",
    }));
    return new Response(JSON.stringify(newMessage), { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
export async function DELETE(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Non autorisé", { status: 401 });
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("id");
  if (!messageId) return new Response("ID manquant", { status: 400 });
  try {
    const messages = await readMessagesFromS3(false);
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredMessages = messages.filter((m: any) => m.id.toString() !== messageId);
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: FILE_KEY,
      Body: JSON.stringify(filteredMessages, null, 2),
      ContentType: "application/json",
    }));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
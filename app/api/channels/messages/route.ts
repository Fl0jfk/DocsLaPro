import { NextRequest } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import {
  getBucketName,
  getTenantJson,
  getTenantS3Client,
  getTenantSignedReadUrl,
  putTenantJson,
} from "@/app/lib/tenant-s3-storage";
const FILE_KEY = "chat/messages.json";

async function readMessagesFromS3(orgId: string, shouldSign: boolean = true) {
  try {
    const hit = await getTenantJson<unknown[]>(orgId, FILE_KEY);
    const messages = Array.isArray(hit?.data) ? hit.data : [];
    if (!shouldSign) return messages;

    const bucket = getBucketName();
    const client = getTenantS3Client();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signedMessages = await Promise.all(
      messages.map(async (m: any) => {
        if (!m.content?.includes?.("[IMG]") && !m.content?.includes?.("[DOC]")) return m;
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
          const region = process.env.REGION || "eu-west-3";
          const marker = `${bucket}.s3.${region}.amazonaws.com/`;
          const idx = fileUrl.indexOf(marker);
          const fileKey = idx >= 0 ? fileUrl.slice(idx + marker.length) : "";
          if (fileKey) {
            const rel = fileKey.includes("/") && fileKey.startsWith("tenants/")
              ? fileKey
              : fileKey.replace(`tenants/${orgId}/`, "");
            const signedUrl =
              (await getTenantSignedReadUrl(orgId, rel, 3600)) ||
              (await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: fileKey }), { expiresIn: 3600 }));
            m.content = isImg ? `[IMG]${signedUrl}` : `${fileName}|${signedUrl}`;
          }
        } catch (err) {
          console.error("Erreur de signature individuelle:", err);
        }
        return m;
      }),
    );
    return signedMessages;
  } catch (e) {
    console.error("Erreur lecture messages S3:", e);
    return [];
  }
}

export async function GET() {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const messages = await readMessagesFromS3(gate.ctx.orgId, true);
  return new Response(JSON.stringify(messages), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.ctx;
  const { userId: authUserId } = getAuth(req);
  if (!authUserId) return new Response("Non autorisé", { status: 401 });
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const body = await req.json();
    const messages = await readMessagesFromS3(orgId, false);
    const newMessage = {
      id: Date.now(),
      channel: body.channel,
      content: body.content,
      createdAt: new Date().toISOString(),
      authorName: body.isAnonymous ? "Anonyme" : `${user.firstName} ${user.lastName}`,
      authorId: body.isAnonymous ? null : userId,
      avatar: body.isAnonymous ? null : user.imageUrl,
    };
    messages.push(newMessage);
    await putTenantJson(orgId, FILE_KEY, messages);
    return new Response(JSON.stringify(newMessage), { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { orgId } = gate.ctx;
  const { userId } = getAuth(req);
  if (!userId) return new Response("Non autorisé", { status: 401 });
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("id");
  if (!messageId) return new Response("ID manquant", { status: 400 });
  try {
    const messages = await readMessagesFromS3(orgId, false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredMessages = messages.filter((m: any) => m.id.toString() !== messageId);
    await putTenantJson(orgId, FILE_KEY, filteredMessages);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

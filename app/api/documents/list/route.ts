import { NextRequest } from "next/server";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CacheEntry = { data: any; timestamp: number };
const cache: Record<string, CacheEntry> = {};

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId)
    return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const roles = user.publicMetadata.role as string[] || [];
  const folder: string[] = [];
  if (roles.includes("professeur")) folder.push("professeurs/");
  if (roles.includes("administratif")) folder.push("administratif/");
  if (roles.includes("direction")) folder.push("direction/");
  if (roles.includes("comptabilité")) folder.push("comptabilité/");;
  const url = new URL(req.url);
  const prefixParam = url.searchParams.get("prefix") || "";
  const prefix = prefixParam.startsWith("documents/")
    ? prefixParam
    : `documents/${folder}${prefixParam}`;
  const cacheKey = `${userId}-${prefix}`;
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < 5 * 60 * 1000) {
    return new Response(JSON.stringify(cache[cacheKey].data), { status: 200 });
  }
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.BUCKET_NAME!,
      Prefix: prefix,
      Delimiter: "/",
    });
    const response = await s3.send(command);
    const folders = response.CommonPrefixes?.map(p => ({
      type: "folder" as const,
      name: p.Prefix!.split("/").slice(-2, -1)[0],
      path: p.Prefix!,
    })) || [];
    const files = await Promise.all(
      (response.Contents || [])
        .filter(file => file.Key && !file.Key.endsWith("/"))
        .filter(file =>
          [".pdf", ".doc", ".docx", ".xls", ".xlsx"].some(ext =>
            file.Key!.toLowerCase().endsWith(ext)
          )
        )
        .map(async file => {
          const getObjectCommand = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME!,
            Key: file.Key!,
          });
          const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 6000 });
          return {
            type: "file" as const,
            name: file.Key!.split("/").pop()!.replace(/\.(pdf|docx?|xlsx?|xls)$/, ""),
            url,
            path: file.Key!,
            ext: file.Key!.split(".").pop()?.toLowerCase(),
          };
        })
    );
    const items = [...folders, ...files];
    cache[cacheKey] = { data: items, timestamp: now };
    return new Response(JSON.stringify(items), { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Erreur S3:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
import { NextRequest } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: { accessKeyId: process.env.ACCESS_KEY_ID!, secretAccessKey: process.env.SECRET_ACCESS_KEY!},
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CacheEntry = { data: any; timestamp: number };
const cache: Record<string, CacheEntry> = {};

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) { return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });}
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const roles = (user.publicMetadata.role as string[]) || [];
  const baseFolders: string[] = [];
  if (roles.includes("professeur")) baseFolders.push("professeurs/");
  if (roles.includes("administratif")) baseFolders.push("administratif/");
  if (roles.includes("direction")) baseFolders.push("direction/");
  if (roles.includes("comptabilité")) baseFolders.push("Compta RH/");
  if (roles.includes("education")) baseFolders.push("education/");
  const userFolders = [...new Set(baseFolders.map(f => `documents/${f}`))];
  const url = new URL(req.url);
  const prefixParam = url.searchParams.get("prefix") || "";
  const cacheKey = `${userId}-${prefixParam}`;
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < 5 * 60 * 1000) {return new Response(JSON.stringify(cache[cacheKey].data), { status: 200 });}
  try {
    const allItems: { type: "folder" | "file"; name: string; path: string; ext?: string}[] = [];
    for (const folderPrefix of userFolders) {
      const effectivePrefix = prefixParam.startsWith("documents/") ? prefixParam : `${folderPrefix}${prefixParam}`;
      const command = new ListObjectsV2Command({ Bucket: process.env.BUCKET_NAME!, Prefix: effectivePrefix, Delimiter: "/"});
      const response = await s3.send(command);
      const folders = response.CommonPrefixes?.map(p => ({
        type: "folder" as const,
        name: `${p.Prefix!.split("/").slice(-2, -1)[0]} (${folderPrefix.replace("documents/", "")})`,
        path: p.Prefix!,
      })) || [];
      const files = (response.Contents || []) .filter(file => file.Key && !file.Key.endsWith("/")) .filter(file => [".pdf", ".doc", ".docx", ".xls", ".xlsx"].some(ext => file.Key!.toLowerCase().endsWith(ext)))
        .map(file => ({ type: "file" as const, name: `${file.Key!.split("/").pop()!.replace(/\.(pdf|docx?|xlsx?|xls)$/, "")} (${folderPrefix.replace("documents/", "")})`, path: file.Key!, ext: file.Key!.split(".").pop()?.toLowerCase()}));
      allItems.push(...folders, ...files);
    }
    const uniqueItems = Array.from(new Map(allItems.map(item => [item.path, item])).values());
    cache[cacheKey] = { data: uniqueItems, timestamp: now };
    return new Response(JSON.stringify(uniqueItems), { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Erreur S3:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

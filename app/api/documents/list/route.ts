import { NextRequest } from "next/server";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Cache en mémoire
type CacheEntry = { data: any; timestamp: number };
const cache: Record<string, CacheEntry> = {};

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const role = user.publicMetadata.role as string;

  let folder = "";
  if (role === "professeur") folder = "professeurs/";
  else if (role === "administratif") folder = "administratif/";
  else if (role === "direction") folder = "direction/";
  else if (role === "admin") folder = "admin/";
  else return new Response(JSON.stringify({ error: "Accès refusé" }), { status: 403 });

  const url = new URL(req.url);
  const prefixParam = url.searchParams.get("prefix") || "";

  const cacheKey = `${userId}-${prefixParam}`;
  const now = Date.now();

  // Si cache valide (< 5 min), renvoyer directement
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < 5 * 60 * 1000) {
    return new Response(JSON.stringify(cache[cacheKey].data), { status: 200 });
  }

  const prefix = `documents/${folder}${prefixParam}`;

  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
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
        .filter(file => file.Key!.endsWith(".pdf"))
        .map(async file => {
          const getObjectCommand = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: file.Key!,
          });
          const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 6000 });
          return {
            type: "file" as const,
            name: file.Key!.split("/").pop()!.replace(".pdf", ""),
            url,
            path: file.Key!,
          };
        })
    );

    const items = [...folders, ...files];

    // Stocker dans le cache
    cache[cacheKey] = { data: items, timestamp: now };

    return new Response(JSON.stringify(items), { status: 200 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Erreur S3:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

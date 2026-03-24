import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NewsItem } from "../get/route";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const NEWS_KEY = "news/slider.json";

const isNewsAdmin = (roles: string[]) =>
  roles.includes("administratif") ||
  roles.includes("comptabilité") ||
  roles.includes("education") ||
  roles.includes("maintenance") ||
  roles.some((r) => r.startsWith("direction_"));

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const roles = (user.publicMetadata.role as string[]) || [];
  if (!isNewsAdmin(roles)) return new NextResponse("Action non autorisée", { status: 403 });

  try {
    const body = await req.json();
    const items: unknown[] = body?.items;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Payload invalide: items doit être un tableau" }, { status: 400 });
    }

    const cleaned: NewsItem[] = items
      .filter((x) => x && typeof x === "object")
      .map((x) => {
        const item = x as Record<string, unknown>;
        const type = item.type === "lien" ? "lien" : "article";
        const out: NewsItem = {
          id: String(item.id ?? "").trim(),
          type,
          title: String(item.title ?? "").trim(),
          subtitle: String(item.subtitle ?? "").trim(),
          description: String(item.description ?? "").trim(),
          image: String(item.image ?? "").trim(),
          buttonText: String(item.buttonText ?? "").trim(),
        };
        if (item.category) out.category = item.category as NewsItem["category"];
        if (item.body) out.body = String(item.body).trim();
        if (Array.isArray(item.images) && item.images.length > 0)
          out.images = (item.images as unknown[]).map(String).filter(Boolean);
        if (type === "lien" && item.link) out.link = String(item.link).trim();
        return out;
      })
      .filter((x) => x.id && x.title && x.buttonText);

    if (cleaned.length === 0) {
      return NextResponse.json({ error: "Aucun item valide dans items" }, { status: 400 });
    }

    const jsonBody = JSON.stringify(cleaned, null, 2);

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: NEWS_KEY,
      ContentType: "application/json",
    });
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    const putRes = await fetch(signedUrl, {
      method: "PUT",
      body: jsonBody,
      headers: { "Content-Type": "application/json" },
    });

    if (!putRes.ok) {
      throw new Error(`Échec de l'écriture S3: ${putRes.status} ${putRes.statusText}`);
    }

    return NextResponse.json({ success: true, count: cleaned.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Erreur update news:", err);
    return NextResponse.json({ error: "Erreur update news", details: msg }, { status: 500 });
  }
}

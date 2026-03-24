import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const NEWS_KEY = "news/slider.json";

export type NewsCategory = "école" | "collège" | "lycée" | "groupe";

export type NewsItem = {
  id: string;
  type: "article" | "lien";
  category?: NewsCategory;
  title: string;
  subtitle: string;
  description: string;
  body?: string;       // full article content, only for type "article"
  image: string;
  images?: string[];   // additional gallery images, only for type "article"
  link?: string;       // only for type "lien"
  buttonText: string;
};

function parseNewsPayload(payload: unknown): NewsItem[] {
  const arr = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload && "items" in payload
      ? (payload as { items: unknown[] }).items
      : null;

  if (!Array.isArray(arr)) return [];

  return arr
    .filter((x) => x && typeof x === "object")
    .map((x) => {
      const item = x as Record<string, unknown>;
      const type = item.type === "lien" ? "lien" : "article";
      const parsed: NewsItem = {
        id: String(item.id ?? ""),
        type,
        title: String(item.title ?? ""),
        subtitle: String(item.subtitle ?? ""),
        description: String(item.description ?? ""),
        image: String(item.image ?? ""),
        buttonText: String(item.buttonText ?? ""),
      };
      if (item.category) parsed.category = item.category as NewsCategory;
      if (item.body) parsed.body = String(item.body);
      if (Array.isArray(item.images) && item.images.length > 0)
        parsed.images = (item.images as unknown[]).map(String).filter(Boolean);
      if (type === "lien" && item.link) parsed.link = String(item.link);
      return parsed;
    })
    .filter((x) => x.id && x.title && x.buttonText);
}

export async function GET() {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: NEWS_KEY,
    });
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    const res = await fetch(signedUrl);
    if (!res.ok) {
      console.warn(`news/slider.json inaccessible (${res.status})`);
      return NextResponse.json([]);
    }

    const text = await res.text();
    if (!text.trim()) return NextResponse.json([]);

    const parsed = JSON.parse(text);
    return NextResponse.json(parseNewsPayload(parsed));
  } catch (err: unknown) {
    console.error("Erreur chargement news JSON:", err);
    return NextResponse.json([]);
  }
}

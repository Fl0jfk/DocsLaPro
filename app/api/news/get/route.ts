import { NextResponse } from "next/server";
import { getTenantJson } from "@/app/lib/tenant-s3-storage";
import { getLegacyTenantOrgId } from "@/app/lib/tenant";

const NEWS_KEY = "news/slider.json";

export type NewsCategory = "école" | "collège" | "lycée" | "groupe";

export type NewsItem = {
  id: string;
  type: "article" | "lien";
  category?: NewsCategory;
  title: string;
  subtitle: string;
  description: string;
  body?: string;
  image: string;
  images?: string[];
  link?: string;
  buttonText: string;
  textColor?: "white" | "black";
  buttonStyle?: "light" | "dark";
  imageFit?: "cover" | "contain";
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
      if (item.textColor === "black" || item.textColor === "white") parsed.textColor = item.textColor;
      if (item.buttonStyle === "dark" || item.buttonStyle === "light") parsed.buttonStyle = item.buttonStyle;
      if (item.imageFit === "cover" || item.imageFit === "contain") parsed.imageFit = item.imageFit;
      return parsed;
    })
    .filter((x) => x.id && x.title && x.buttonText);
}

/** Actualités publiques : org legacy ou première org migrée. */
export async function GET() {
  const orgId = getLegacyTenantOrgId();
  if (!orgId) {
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
  try {
    const hit = await getTenantJson<unknown>(orgId, NEWS_KEY);
    if (!hit?.data) {
      return NextResponse.json([], { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    return NextResponse.json(parseNewsPayload(hit.data), {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    console.error("Erreur chargement news JSON:", err);
    return NextResponse.json([]);
  }
}

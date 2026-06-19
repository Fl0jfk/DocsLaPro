import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/intranet-auth";

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  try {
    const body = await req.json();
    const street = String(body.street || "").trim();
    const zip = String(body.zip || "").trim();
    const city = String(body.city || "").trim();
    const query = [street, zip, city].filter(Boolean).join(", ");
    if (!query) {
      return NextResponse.json({ error: "Adresse incomplète pour le géocodage." }, { status: 400 });
    }
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "fr");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "docsLaPro/1.0 (school intranet onboarding)" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Géocodage indisponible." }, { status: 502 });
    }
    const data = (await res.json()) as NominatimResult[];
    const hit = data[0];
    if (!hit?.lat || !hit.lon) {
      return NextResponse.json({ error: "Adresse introuvable. Vérifiez rue, code postal et ville." }, { status: 404 });
    }
    return NextResponse.json({
      latitude: Number(hit.lat),
      longitude: Number(hit.lon),
      displayName: hit.display_name,
    });
  } catch (e) {
    console.error("[settings/geocode]", e);
    return NextResponse.json({ error: "Erreur géocodage." }, { status: 500 });
  }
}

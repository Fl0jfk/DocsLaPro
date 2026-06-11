import { NextResponse } from "next/server";
import JSZip from "jszip";
import { requireAuth } from "@/app/lib/intranet-auth";
import { getJson } from "@/app/lib/s3-storage";
import { fetchTravelsPdfBytes } from "@/app/lib/travels-s3";
import { assertTravelsTripAccess } from "@/app/lib/travels-rbac-server";
import type { TravelsTrip } from "@/app/lib/travels-types";

function safeFilename(name: string, index: number) {
  const base = name.replace(/[^\w.\- àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/gi, "_") || `fichier_${index}`;
  return base.endsWith(".pdf") || base.includes(".") ? base : `${base}.pdf`;
}

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  try {
    const { tripId } = await req.json();
    if (!tripId) return NextResponse.json({ error: "tripId requis" }, { status: 400 });

    const hit = await getJson<TravelsTrip>(`travels/${tripId}.json`);
    const trip = hit?.data;
    if (!trip) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

    const access = await assertTravelsTripAccess(trip);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const zip = new JSZip();
    const folder = zip.folder(`Sortie_${trip.data.title?.replace(/\s+/g, "_") || tripId}`) || zip;

    let idx = 0;
    const addFile = async (name: string, url: string) => {
      try {
        const bytes = await fetchTravelsPdfBytes(url);
        folder.file(safeFilename(name, idx++), bytes);
      } catch (e) {
        console.warn("[export-zip] skip", name, e);
      }
    };

    for (const att of trip.data.attachments || []) {
      if (att?.url) await addFile(att.name || "document", att.url);
    }

    for (const q of trip.receivedDevis || []) {
      const quote = q as { providerName?: string; fileUrl?: string };
      if (quote.fileUrl) {
        await addFile(`Devis_${quote.providerName || "transport"}.pdf`, quote.fileUrl);
      }
    }

    if (trip.data.signedQuoteUrl) {
      await addFile("Devis_bus_signe.pdf", trip.data.signedQuoteUrl);
    }

    const manifest = {
      id: trip.id,
      title: trip.data.title,
      status: trip.status,
      destination: trip.data.destination,
      exportedAt: new Date().toISOString(),
      history: trip.history || [],
      transportAmendments: trip.data.transportAmendments || [],
      cuisineAmendments: trip.data.cuisineAmendments || [],
    };
    folder.file("manifest.json", JSON.stringify(manifest, null, 2));

    const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const filename = `Dossier_${tripId}.zip`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("[export-zip]", e);
    return NextResponse.json({ error: "Export ZIP impossible" }, { status: 500 });
  }
}

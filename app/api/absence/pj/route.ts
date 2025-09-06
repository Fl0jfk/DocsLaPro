import { NextRequest, NextResponse } from "next/server";
import { readStore, AbsenceEntry } from "@/app/utils/jsonStore";
import { s3, BUCKET } from "@/app/utils/s3client";
import { GetObjectCommand } from "@aws-sdk/client-s3";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function streamToArrayBuffer(stream: any): Promise<ArrayBuffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).buffer;
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const idxStr = req.nextUrl.searchParams.get("idx");
    if (!id || !idxStr) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    const idx = parseInt(idxStr, 10);
    const absences: AbsenceEntry[] = await readStore();
    const absence = absences.find(a => a.id === id);
    if (!absence) return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
    const justificatif = absence.justificatifs?.[idx];
    if (!justificatif || !justificatif.s3Key) return NextResponse.json({ error: "Justificatif introuvable" }, { status: 404 });
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: justificatif.s3Key });
    const data = await s3.send(command);
    if (!data.Body) return NextResponse.json({ error: "Impossible de récupérer le fichier" }, { status: 500 });
    const arrayBuffer = await streamToArrayBuffer(data.Body);
    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": justificatif.type,
        "Content-Disposition": `inline; filename="${justificatif.filename}"`,
      },
    });
  } catch (err) {
    console.error("Erreur /api/absence/pj:", err);
    return NextResponse.json({ error: "Erreur serveur", details: (err as Error).message }, { status: 500 });
  }
}

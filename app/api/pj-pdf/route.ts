import { NextRequest } from "next/server";
import { readStore } from "@/app/utils/jsonStore";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  const idx = Number(searchParams.get("idx"));
  if (!id || isNaN(idx)) return new Response("Paramètres manquants.", { status: 400 });
  const absences = await readStore();
  const abs = absences.find(a => a.id === id);
  if (!abs || !abs.justificatifs || !abs.justificatifs[idx])
    return new Response("Justificatif non trouvé.", { status: 404 });
  const pj = abs.justificatifs[idx];
  return new Response(Buffer.from(pj.buffer, "base64"), {
    headers: {
      "Content-Type": pj.type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(pj.filename)}"`,
    },
  });
}

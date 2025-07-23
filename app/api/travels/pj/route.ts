import { NextRequest } from "next/server";
import { readVoyages } from "@/app/utils/voyageStore";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  const idx = searchParams.get("idx");
  const prog = searchParams.get("prog");
  const devisIdx = searchParams.get("devis");
  const voyages = await readVoyages();
  const voyage = voyages.find(v => v.id === id);
  if (!voyage) return new Response("Non trouvé", { status: 404 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pj: any;
  if (prog && voyage.programme) pj = voyage.programme;
  else if (typeof idx === "string" && voyage.pieces_jointes && voyage.pieces_jointes[Number(idx)]) pj = voyage.pieces_jointes[Number(idx)];
  else if (typeof devisIdx === "string" && voyage.devis && voyage.devis[Number(devisIdx)]) pj = voyage.devis[Number(devisIdx)];
  if (!pj) return new Response("Non trouvé", { status: 404 });
  return new Response(Buffer.from(pj.buffer, "base64"), {
    headers: {
      "Content-Type": pj.type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(pj.filename)}"`,
    },
  });
}
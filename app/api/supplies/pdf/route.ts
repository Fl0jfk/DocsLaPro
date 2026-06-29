import { NextResponse } from "next/server";
import { getToolboxConfig } from "@/app/lib/toolbox-config";
import type { FournituresChild } from "@/app/lib/fournitures-types";
import { buildSuppliesListPdf } from "@/app/lib/fournitures-supplies-pdf";

/** Génère le PDF liste de fournitures (impression navigateur). */
export async function POST(req: Request) {
  try {
    const toolbox = await getToolboxConfig();
    if (!toolbox.tools["simulateur-fournitures"].enabled) {
      return NextResponse.json({ error: "Simulateur fournitures désactivé." }, { status: 404 });
    }

    const body = await req.json();
    const children = (body?.children || []) as FournituresChild[];

    if (!Array.isArray(children) || children.length === 0) {
      return NextResponse.json({ error: "Ajoutez au moins un enfant." }, { status: 400 });
    }

    const suppliesByChild = (body?.suppliesByChild || {}) as Record<
      string,
      Array<{ title: string; items: string[] }>
    >;

    const { buffer, filename } = await buildSuppliesListPdf({ children, suppliesByChild });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("supplies/pdf error:", message);
    return NextResponse.json({ error: "Échec de la génération du PDF.", details: message }, { status: 500 });
  }
}

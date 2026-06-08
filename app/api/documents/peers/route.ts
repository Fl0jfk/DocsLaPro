import { NextResponse } from "next/server";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { listDocumentPeers } from "@/app/lib/documents-cloud";

export async function GET() {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;

  try {
    const peers = await listDocumentPeers(gate.ctx.userId);
    return NextResponse.json({ peers });
  } catch (e) {
    console.error("documents peers:", e);
    return NextResponse.json({ error: "Impossible de charger le personnel." }, { status: 500 });
  }
}

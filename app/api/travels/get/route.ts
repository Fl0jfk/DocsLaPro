import { NextResponse } from 'next/server';
import { getTenantJson } from "@/app/lib/tenant-s3-storage";
import { requireTenantAuth } from "@/app/lib/tenant-auth";

export async function GET(req: Request) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return new NextResponse("ID manquant", { status: 400 });
  try {
    const hit = await getTenantJson<unknown>(gate.ctx.orgId, `travels/${id}.json`);
    if (!hit?.data) return NextResponse.json({ error: "Impossible de récupérer le dossier" }, { status: 404 });
    return NextResponse.json(hit.data);
  } catch (error) {
    console.error("Erreur S3 Get:", error);
    return NextResponse.json({ error: "Impossible de récupérer le dossier" }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { getTenantSignedReadUrl } from "@/app/lib/tenant-s3-storage";

export async function GET(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { orgId } = gate.ctx;
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return new Response(JSON.stringify({ error: "Clé absente" }), { status: 400 });
  try {
    const url = await getTenantSignedReadUrl(orgId, key, 3600);
    if (!url) return new Response(JSON.stringify({ error: "Fichier introuvable" }), { status: 404 });
    return new Response(JSON.stringify({ url }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}

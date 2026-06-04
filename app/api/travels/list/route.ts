import { NextResponse } from 'next/server';
import { getTenantJson } from "@/app/lib/tenant-s3-storage";
import { requireTenantAuth } from "@/app/lib/tenant-auth";

export async function GET() {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  try {
    const hit = await getTenantJson<unknown[]>(gate.ctx.orgId, "travels/index.json");
    const trips = Array.isArray(hit?.data) ? hit.data : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedTrips = trips.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(sortedTrips);
  } catch (error) {
    console.error("Erreur S3 List:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération de l'index" }, { status: 500 });
  }
}

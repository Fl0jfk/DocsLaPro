import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { loadPublicTenantCatalog } from "@/app/lib/tenant-portal";
import { normalizeHostname } from "@/app/lib/tenant-registry";

/** Catalogue public des établissements (portail de connexion scola.fr). */
export async function GET() {
  try {
    const h = await headers();
    const portalHost = normalizeHostname(h.get("x-forwarded-host") || h.get("host") || "");
    const tenants = await loadPublicTenantCatalog(portalHost);
    return NextResponse.json(
      { tenants },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (e) {
    console.error("[tenants/public]", e);
    return NextResponse.json({ error: "Catalogue indisponible." }, { status: 500 });
  }
}

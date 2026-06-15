import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { loadAppConfig } from "@/app/lib/app-config";
import { requireAuth } from "@/app/lib/intranet-auth";
import { isOrgAdminFromPublicMetadata } from "@/app/lib/intranet-session";
import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";

/** Contexte intranet pour les pages admin (établissements actifs, identité courte). */
export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    const [config, user] = await Promise.all([loadAppConfig(), currentUser()]);
    const intranetRoles = intranetRolesFromMetadata(user?.publicMetadata);
    return NextResponse.json({
      identity: {
        name: config.identity.name,
        shortName: config.identity.shortName,
      },
      establishments: config.establishments,
      profRoom: config.profRoom,
      domainPlanning: config.domainPlanning,
      session: {
        intranetRoles,
        isGlobalAdmin: isOrgAdminFromPublicMetadata(user?.publicMetadata),
      },
    });
  } catch (e) {
    console.error("[app/context]", e);
    return NextResponse.json({ error: "Configuration indisponible." }, { status: 500 });
  }
}

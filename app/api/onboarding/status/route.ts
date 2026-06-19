import { NextResponse } from "next/server";
import { loadAppConfig } from "@/app/lib/app-config";
import { requireAuth } from "@/app/lib/intranet-auth";
import { isOrgAdminFromPublicMetadata } from "@/app/lib/intranet-session";
import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";
import { currentUser } from "@clerk/nextjs/server";
import { onboardingStatusFromConfig } from "@/app/lib/onboarding-status";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    const [config, user] = await Promise.all([loadAppConfig(), currentUser()]);
    const status = onboardingStatusFromConfig(config);
    const isOrgAdmin = isOrgAdminFromPublicMetadata(user?.publicMetadata);
    return NextResponse.json({
      ...status,
      isOrgAdmin,
      identity: {
        name: config.identity.name,
        shortName: config.identity.shortName,
        organizationKind: config.identity.organizationKind,
      },
    });
  } catch (e) {
    console.error("[onboarding/status]", e);
    return NextResponse.json({ error: "Statut onboarding indisponible." }, { status: 500 });
  }
}

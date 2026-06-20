import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";
import { requireAuth } from "@/app/lib/intranet-auth";
import { canPurgeStages } from "@/app/lib/stage-referent";
import { purgeStageSchoolYear } from "@/app/lib/stage-purge";
import { currentStageSchoolYear } from "@/app/lib/stage-types";

export async function POST(req: Request) {
  try {
    const gate = await requireAuth();
    if (!gate.ok) return gate.response;

    const user = await currentUser();
    const roles = intranetRolesFromMetadata(user?.publicMetadata);
    if (!canPurgeStages(roles)) {
      return NextResponse.json({ error: "Réservé à l'administratif." }, { status: 403 });
    }

    const body = await req.json();
    const schoolYear = String(body.schoolYear ?? "").trim() || currentStageSchoolYear();
    const dryRun = body.dryRun === true;

    const result = await purgeStageSchoolYear(schoolYear, { dryRun });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { loadAppConfig } from "@/app/lib/app-config";
import { emailMicrosoftLicenseRequest } from "@/app/lib/microsoft-license-email";
import type { MicrosoftLicensePerson } from "@/app/lib/microsoft-license-types";
import {
  loadMicrosoftLicenseRequest,
  saveMicrosoftLicenseRequest,
  validateMicrosoftLicensePeople,
} from "@/app/lib/microsoft-license-request";
import { requireAdmin } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const existing = await loadMicrosoftLicenseRequest();
  return NextResponse.json({ request: existing });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  try {
    const body = (await req.json()) as {
      people?: Omit<MicrosoftLicensePerson, "id">[];
      notes?: string;
    };

    const people = body.people || [];
    const validationError = validateMicrosoftLicensePeople(people);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const cfg = await loadAppConfig();
    const establishmentName = cfg.identity?.name?.trim();
    const user = await safeCurrentUser();
    const submittedBy =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      undefined;

    const saved = await saveMicrosoftLicenseRequest({
      people,
      notes: body.notes,
      submittedBy,
      establishmentName,
    });

    await emailMicrosoftLicenseRequest(saved).catch((e) => {
      console.error("[microsoft-licenses] email", e);
    });

    return NextResponse.json({ success: true, request: saved });
  } catch (e) {
    console.error("[microsoft-licenses]", e);
    const msg = e instanceof Error ? e.message : "Enregistrement impossible";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

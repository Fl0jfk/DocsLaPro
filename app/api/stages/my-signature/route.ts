import { safeCurrentUser } from "@/app/lib/intranet-session";
import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";
import { canViewReferentConventions } from "@/app/lib/stage-access";
import {
  loadReferentSignatureBytes,
  parsePngBase64,
  saveReferentSignature,
} from "@/app/lib/stage-signature-store";

export async function GET() {
  try {
    const gate = await requireAuth();
    if (!gate.ok) return gate.response;

    const user = await safeCurrentUser();
    const roles = intranetRolesFromMetadata(user?.publicMetadata);
    if (!canViewReferentConventions(roles) && !roles.includes("administratif")) {
      return NextResponse.json({ error: "Réservé aux professeurs." }, { status: 403 });
    }

    const bytes = await loadReferentSignatureBytes(gate.ctx.userId);
    return NextResponse.json({ hasSignature: Boolean(bytes?.length) });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const gate = await requireAuth();
    if (!gate.ok) return gate.response;

    const user = await safeCurrentUser();
    const roles = intranetRolesFromMetadata(user?.publicMetadata);
    if (!canViewReferentConventions(roles) && !roles.includes("administratif")) {
      return NextResponse.json({ error: "Réservé aux professeurs." }, { status: 403 });
    }

    const body = await req.json();
    const png = parsePngBase64(String(body.signaturePngBase64 ?? ""));
    if (!png) {
      return NextResponse.json({ error: "Image PNG invalide." }, { status: 400 });
    }

    await saveReferentSignature(gate.ctx.userId, png);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

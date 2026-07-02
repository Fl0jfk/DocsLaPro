import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { canAccessCertificatesModule } from "@/app/lib/certificates-auth";
import {
  loadCertificateProfSignatureBytes,
  parseCertificatePngBase64,
  saveCertificateProfSignature,
} from "@/app/lib/certificates-signature-store";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const user = await safeCurrentUser();
  if (!canAccessCertificatesModule(user)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const bytes = await loadCertificateProfSignatureBytes(gate.ctx.userId);
  return NextResponse.json({ hasSignature: Boolean(bytes?.length) });
}

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const user = await safeCurrentUser();
  if (!canAccessCertificatesModule(user)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const png = parseCertificatePngBase64(String(body.signaturePngBase64 ?? ""));
  if (!png) return NextResponse.json({ error: "Image PNG invalide." }, { status: 400 });
  await saveCertificateProfSignature(gate.ctx.userId, png);
  return NextResponse.json({ success: true });
}

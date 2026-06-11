import { NextRequest, NextResponse } from "next/server";
import { applyPersonnelSignature, resolvePersonnelSignatureContext } from "@/app/lib/personnel-signature";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() || "";
  if (!token) return NextResponse.json({ error: "Token requis." }, { status: 400 });

  const ctx = await resolvePersonnelSignatureContext(token);
  if (!ctx) return NextResponse.json({ error: "Lien invalide." }, { status: 404 });

  return NextResponse.json({
    employeeName: ctx.record.displayName,
    signatureLabel: ctx.signature.label,
    kind: ctx.ref.kind,
    status: ctx.signature.status,
    endDate: ctx.ref.kind === "offboarding" ? ctx.record.offboarding?.endDate : undefined,
    startDate: ctx.ref.kind === "onboarding" ? ctx.record.onboarding?.startDate : undefined,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "").trim();
  const signerName = String(body.signerName || "").trim();
  if (!token) return NextResponse.json({ error: "Token requis." }, { status: 400 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    undefined;

  const result = await applyPersonnelSignature({ token, signerName, ip });
  if (!result.ok) {
    const status = result.error?.includes("déjà") ? 409 : 404;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, kind: result.kind });
}

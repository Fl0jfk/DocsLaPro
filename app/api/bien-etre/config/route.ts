import { NextResponse } from "next/server";
import { getBienEtreConfig, saveBienEtreConfig } from "@/app/lib/bien-etre-config";
import { requireBienEtreReferentAuth } from "@/app/lib/bien-etre-auth";
import type { BienEtreConfig } from "@/app/lib/bien-etre-types";

export async function GET() {
  const gate = await requireBienEtreReferentAuth();
  if (!gate.ok) return gate.response;
  const config = await getBienEtreConfig();
  return NextResponse.json({ config });
}

export async function PUT(req: Request) {
  const gate = await requireBienEtreReferentAuth();
  if (!gate.ok) return gate.response;
  try {
    const body = (await req.json()) as Partial<BienEtreConfig>;
    const current = await getBienEtreConfig();
    const next: BienEtreConfig = {
      enabled: body.enabled === true,
      psychologistEmail: String(body.psychologistEmail ?? current.psychologistEmail).trim(),
      retentionDays: Math.max(7, Math.min(365, Number(body.retentionDays) || current.retentionDays)),
      welcomeMessage: String(body.welcomeMessage ?? current.welcomeMessage).trim(),
      notificationFromEmail: String(body.notificationFromEmail ?? current.notificationFromEmail ?? "").trim() || undefined,
    };
    if (next.enabled && !next.psychologistEmail) {
      return NextResponse.json(
        { error: "Indiquez l'e-mail du psychologue pour activer le module." },
        { status: 400 },
      );
    }
    await saveBienEtreConfig(next);
    return NextResponse.json({ ok: true, config: next });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

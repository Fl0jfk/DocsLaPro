import { NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/app/lib/intranet-auth";
import { getJson } from "@/app/lib/s3-storage";
import {
  MEF_SECTEURS_KEY,
  countMefCodes,
  parseMefSecteursConfig,
  saveMefSecteursConfig,
  type MefSecteursConfig,
} from "@/app/lib/mef-secteurs";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const hit = await getJson<MefSecteursConfig>( MEF_SECTEURS_KEY);
  const raw = hit?.data ?? { lycee: [], college: [], ecole: [] };
  const parsed = parseMefSecteursConfig(raw);
  const config = parsed.ok ? parsed.config : { lycee: [], college: [], ecole: [] };
  const counts = countMefCodes(config);
  return NextResponse.json({ config, counts, configured: counts.total > 0 });
}

export async function PUT(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  try {
    const body = await req.json();
    const parsed = parseMefSecteursConfig(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    await saveMefSecteursConfig( parsed.config);
    return NextResponse.json({
      success: true,
      counts: countMefCodes(parsed.config),
      message: `Table MEF enregistrée (${countMefCodes(parsed.config).total} code(s)).`,
    });
  } catch (e) {
    console.error("[mef-secteurs] PUT", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur enregistrement" },
      { status: 500 },
    );
  }
}

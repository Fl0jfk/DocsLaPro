import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/intranet-auth";
import {
  mergeClassImportRows,
  parseClassAllocationClassesExcelBuffer,
} from "@/app/lib/class-allocation-classes-import";
import { loadCampaignConfig, saveCampaignConfig } from "@/app/lib/class-allocation-storage";

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis." }, { status: 400 });
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    return NextResponse.json({ error: "Format Excel (.xlsx) requis." }, { status: 400 });
  }

  const parsed = parseClassAllocationClassesExcelBuffer(await file.arrayBuffer());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const current = await loadCampaignConfig();
  const mode = formData.get("mode") === "merge" ? "merge" : "replace";
  const levels = mergeClassImportRows(current.levels, parsed.rows, mode);
  const config = { ...current, levels };
  await saveCampaignConfig(config);

  const actuelles = parsed.rows.filter((r) => r.type === "actuelle").length;
  const cibles = parsed.rows.filter((r) => r.type === "cible").length;

  return NextResponse.json({
    ok: true,
    config,
    imported: parsed.rows.length,
    message: `${parsed.rows.length} ligne(s) importée(s) : ${actuelles} classe(s) actuelle(s), ${cibles} classe(s) cible(s).`,
  });
}

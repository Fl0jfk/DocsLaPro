import { NextResponse } from "next/server";
import { getToolboxConfigResolved, toolboxEnabledTools } from "@/app/lib/toolbox-config";
import { TOOLBOX_TOOLS_META } from "@/app/lib/toolbox-tools";
import { loadAppConfig } from "@/app/lib/app-config";

/** Config publique des outils activés (sans e-mails internes). */
export async function GET() {
  try {
    const [toolbox, app] = await Promise.all([getToolboxConfigResolved(), loadAppConfig()]);
    const enabled = toolboxEnabledTools(toolbox);
    const tools = TOOLBOX_TOOLS_META.filter((m) => enabled.includes(m.id)).map((m) => ({
      id: m.id,
      label: m.label,
      description: m.description,
      adminPath: m.adminPath,
      publicPath: m.publicPath,
      color: m.color,
      bg: m.bg,
      season: m.season,
    }));

    const po = toolbox.tools["portes-ouvertes"];
    const rentree = toolbox.tools.rentree;
    const tarifs = toolbox.tools["simulateur-tarifs"];

    return NextResponse.json({
      siteName: app.identity.name,
      tools,
      rentree: rentree.enabled
        ? {
            title: rentree.title,
            schoolYear: rentree.schoolYear,
            showSimulateurTarifs: rentree.showSimulateurTarifs,
            showSimulateurFournitures: rentree.showSimulateurFournitures,
            pages: rentree.pages,
          }
        : null,
      tarifs: tarifs.enabled
        ? {
            schoolYear: tarifs.schoolYear,
            enseignement: tarifs.enseignement,
            demiPension: tarifs.demiPension,
            pensionAnnuel: tarifs.pensionAnnuel,
            garderie: tarifs.garderie,
          }
        : null,
      portesOuvertes: po.enabled
        ? {
            title: po.title,
            intro: po.intro,
            address: po.address,
            mapsUrl: po.mapsUrl,
            slots: po.slots.map((s) => ({
              id: s.id,
              label: s.label,
              startAt: s.startAt,
              endAt: s.endAt,
              maxPlaces: s.maxPlaces,
            })),
            consentLabel: po.consentLabel,
          }
        : null,
      fournituresEnabled: toolbox.tools["simulateur-fournitures"].enabled,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

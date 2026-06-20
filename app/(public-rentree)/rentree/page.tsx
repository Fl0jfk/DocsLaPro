import { getToolboxConfig } from "@/app/lib/toolbox-config";
import { requireRentreePublicPage } from "@/app/lib/toolbox-public-gate";
import RentreePageClient from "./RentreePageClient";

export default async function RentreePage() {
  const rentree = await requireRentreePublicPage();
  const toolbox = await getToolboxConfig();

  return (
    <RentreePageClient
      title={rentree.title}
      schoolYear={rentree.schoolYear}
      links={rentree.links}
      showTarifs={rentree.showSimulateurTarifs && toolbox.tools["simulateur-tarifs"].enabled}
      showFournitures={rentree.showSimulateurFournitures && toolbox.tools["simulateur-fournitures"].enabled}
      showPortesOuvertes={toolbox.tools["portes-ouvertes"].enabled}
    />
  );
}

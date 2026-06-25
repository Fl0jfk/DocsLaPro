import { loadAppConfig } from "@/app/lib/app-config";
import { resolveRentreePageId } from "@/app/lib/rentree-pages";
import { resolveRentreePagesPublicHrefs } from "@/app/lib/rentree-public-urls";
import { getToolboxConfigResolved } from "@/app/lib/toolbox-config";
import { requireRentreePublicPage } from "@/app/lib/toolbox-public-gate";
import RentreePageClient from "./RentreePageClient";

export default async function RentreePage({
  searchParams,
}: {
  searchParams: Promise<{ establishment?: string; level?: string }>;
}) {
  const rentree = await requireRentreePublicPage();
  const toolbox = await getToolboxConfigResolved();
  const app = await loadAppConfig();
  const sp = await searchParams;
  const initialEstablishmentId = resolveRentreePageId(rentree.pages, app.establishments, {
    establishment: sp.establishment,
    level: sp.level,
  });
  const pages = await resolveRentreePagesPublicHrefs(rentree.pages);

  return (
    <RentreePageClient
      title={rentree.title}
      schoolYear={rentree.schoolYear}
      pages={pages}
      initialEstablishmentId={initialEstablishmentId}
      showFournitures={rentree.showSimulateurFournitures && toolbox.tools["simulateur-fournitures"].enabled}
      showPortesOuvertes={toolbox.tools["portes-ouvertes"].enabled}
    />
  );
}

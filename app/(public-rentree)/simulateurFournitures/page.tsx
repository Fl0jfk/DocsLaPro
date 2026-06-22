import { requireSimulateurFournituresPublicPage } from "@/app/lib/toolbox-public-gate";
import { getToolboxConfig } from "@/app/lib/toolbox-config";
import SimulateurFournituresClient from "./SimulateurFournituresClient";

export default async function SimulateurFournituresPage() {
  await requireSimulateurFournituresPublicPage();
  const toolbox = await getToolboxConfig();
  return <SimulateurFournituresClient config={toolbox.tools["simulateur-fournitures"]} />;
}

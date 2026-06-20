import { requireSimulateurFournituresPublicPage } from "@/app/lib/toolbox-public-gate";
import SimulateurFournituresClient from "./SimulateurFournituresClient";

export default async function SimulateurFournituresPage() {
  await requireSimulateurFournituresPublicPage();
  return <SimulateurFournituresClient />;
}

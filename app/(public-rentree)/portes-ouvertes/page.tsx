import { requirePortesOuvertesPublicPage } from "@/app/lib/toolbox-public-gate";
import PortesOuvertesClient from "./PortesOuvertesClient";

export default async function PortesOuvertesPage() {
  const po = await requirePortesOuvertesPublicPage();
  return <PortesOuvertesClient po={po} />;
}

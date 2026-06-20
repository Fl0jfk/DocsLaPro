import { loadAppConfig } from "@/app/lib/app-config";
import { requireSimulateurTarifsPublicPage } from "@/app/lib/toolbox-public-gate";
import SimulateurTarifsClient from "./SimulateurTarifsClient";

export default async function SimulateurTarifsPage() {
  const [tarifs, app] = await Promise.all([requireSimulateurTarifsPublicPage(), loadAppConfig()]);
  return (
    <SimulateurTarifsClient
      siteName={app.identity.shortName || app.identity.name}
      tarifs={tarifs}
    />
  );
}

import type { ExternalQuickLinkConfig } from "@/app/lib/app-config-schemas";
import type { ExternalQuickLink } from "@/app/lib/intranet-modules";

function toQuickLink(entry: ExternalQuickLinkConfig): ExternalQuickLink {
  return {
    id: entry.id,
    name: entry.name,
    link: entry.link,
    img: entry.img || "",
    allowedRoles: entry.allowedRoles?.length ? entry.allowedRoles : ["administratif"],
  };
}

/** Raccourcis dashboard : uniquement settings/external-links.json (pas integrations.json). */
export function dashboardQuickLinksFromExternalLinks(
  externalLinks: ExternalQuickLinkConfig[],
): ExternalQuickLink[] {
  return externalLinks.map(toQuickLink);
}

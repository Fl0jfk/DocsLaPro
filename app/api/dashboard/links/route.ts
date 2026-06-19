import { NextResponse } from "next/server";
import { loadAppConfig } from "@/app/lib/app-config";
import { requireAuth } from "@/app/lib/intranet-auth";
import type { ExternalQuickLink } from "@/app/lib/intranet-modules";

function mergeIntegrationLinks(config: Awaited<ReturnType<typeof loadAppConfig>>): ExternalQuickLink[] {
  const links: ExternalQuickLink[] = [];
  const ed = config.integrations.ecoleDirecte;
  if (ed?.enabled && ed.loginUrl) {
    links.push({
      id: "ecole-directe",
      name: ed.label || "École Directe",
      link: ed.loginUrl,
      img: "",
      allowedRoles: [
        "direction_college",
        "administratif",
        "professeur",
        "direction_ecole",
        "direction_lycee",
        "maintenance",
        "comptabilite",
        "infirmerie",
        "education",
      ],
    });
  }
  const zd = config.integrations.zeendoc;
  if (zd?.enabled && zd.loginUrl) {
    links.push({
      id: "zeendoc",
      name: "ZeenDoc",
      link: zd.loginUrl,
      img: "",
      allowedRoles: ["administratif", "comptabilite", "direction_college", "direction_ecole", "direction_lycee"],
    });
  }
  for (const l of config.externalLinks) {
    if (links.some((x) => x.id === l.id)) continue;
    links.push({
      id: l.id,
      name: l.name,
      link: l.link,
      img: l.img || "",
      allowedRoles: l.allowedRoles?.length ? l.allowedRoles : ["administratif"],
    });
  }
  return links;
}

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    const config = await loadAppConfig();
    return NextResponse.json({ links: mergeIntegrationLinks(config) });
  } catch (e) {
    console.error("[dashboard/links]", e);
    return NextResponse.json({ links: [] });
  }
}

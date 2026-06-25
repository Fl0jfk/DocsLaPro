import type {
  FournituresPartnerLink,
  FournituresProfileOverrides,
  FournituresSection,
  FournituresStage,
  FournituresStagePartnerLinks,
  FournituresToolConfig,
} from "@/app/lib/fournitures-types";

const STAGES: FournituresStage[] = ["ecole", "college", "lycee"];

function parsePartnerLink(raw: unknown): FournituresPartnerLink | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") {
    const url = raw.trim();
    return url ? { url } : undefined;
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const url = String(o.url || "").trim();
    if (!url) return undefined;
    const label = String(o.label || "").trim() || undefined;
    return label ? { url, label } : { url };
  }
  return undefined;
}

function parseStageLinks(raw: Record<string, unknown>): FournituresStagePartnerLinks {
  const rawLinks = raw.stageLinks;
  if (rawLinks && typeof rawLinks === "object") {
    const out: FournituresStagePartnerLinks = {};
    for (const stage of STAGES) {
      const link = parsePartnerLink((rawLinks as Record<string, unknown>)[stage]);
      if (link) out[stage] = link;
    }
    if (Object.keys(out).length > 0) return out;
  }

  const out: FournituresStagePartnerLinks = {};
  const colbert = String(raw.colbertPdfUrl || "").trim();
  const arbs = String(raw.arbsPdfUrl || "").trim();
  if (colbert) {
    const link: FournituresPartnerLink = { url: colbert, label: "Colbert" };
    out.ecole = link;
    out.college = { ...link };
  }
  if (arbs) {
    out.lycee = { url: arbs, label: "ARBS" };
  }
  return out;
}

function parseSections(raw: unknown): FournituresSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const title = String(o.title || "").trim();
      const items = Array.isArray(o.items)
        ? o.items.map((x) => String(x).trim()).filter(Boolean)
        : [];
      if (!title && items.length === 0) return null;
      return { title: title || "Rubrique", items };
    })
    .filter((x): x is FournituresSection => Boolean(x));
}

export function parseFournituresProfiles(raw: unknown): FournituresProfileOverrides {
  if (!raw || typeof raw !== "object") return {};
  const out: FournituresProfileOverrides = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const id = String(key).trim();
    if (!id) continue;
    const sections = parseSections(val);
    if (sections.length > 0) out[id] = sections;
  }
  return out;
}

export function parseFournituresToolConfig(
  raw: Record<string, unknown>,
  defaults: FournituresToolConfig,
): FournituresToolConfig {
  return {
    enabled: raw.enabled === true,
    title: String(raw.title || defaults.title).trim(),
    schoolYear: String(raw.schoolYear || defaults.schoolYear).trim(),
    stageLinks: parseStageLinks(raw),
    profiles: parseFournituresProfiles(raw.profiles),
  };
}

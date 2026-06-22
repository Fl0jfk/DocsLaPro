import type {
  FournituresProfileOverrides,
  FournituresSection,
  FournituresToolConfig,
} from "@/app/lib/fournitures-types";

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
    colbertPdfUrl: String(raw.colbertPdfUrl || defaults.colbertPdfUrl || "").trim() || undefined,
    arbsPdfUrl: String(raw.arbsPdfUrl || defaults.arbsPdfUrl || "").trim() || undefined,
    profiles: parseFournituresProfiles(raw.profiles),
  };
}

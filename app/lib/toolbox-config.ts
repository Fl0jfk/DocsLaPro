import "server-only";

import { getJson, putJson } from "@/app/lib/s3-storage";
import {
  defaultToolboxConfig,
  type ToolboxConfig,
  type ToolboxToolId,
} from "@/app/lib/toolbox-types";
import { RENTREE_LINKS, type RentreeLinksByLevel } from "@/app/(public-rentree)/rentree/rentree-links";

export type {
  ToolboxConfig,
  ToolboxToolId,
  TarifsNiveau,
  SimulateurTarifsConfig,
  PortesOuvertesSlot,
  PortesOuvertesToolConfig,
  SecretSantaToolConfig,
  RentreeToolConfig,
} from "@/app/lib/toolbox-types";

export { DEFAULT_TARIFS, defaultToolboxConfig } from "@/app/lib/toolbox-types";

const TOOLBOX_KEY = "settings/modules/toolbox.json";

function numRecord(v: unknown): Record<string, number> {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    const n = Number(val);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

function numArr(v: unknown, len = 5): number[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => Number(x)).filter((n) => Number.isFinite(n)).slice(0, len);
}

function parseRentreeLinks(raw: unknown): RentreeLinksByLevel[] {
  if (!Array.isArray(raw) || raw.length === 0) return RENTREE_LINKS;
  return raw
    .map((item) => {
      const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const level: RentreeLinksByLevel["level"] =
        o.level === "college" || o.level === "lycee" ? o.level : "ecole";
      const accent: RentreeLinksByLevel["accent"] =
        o.accent === "sky" || o.accent === "pink" ? o.accent : "yellow";
      const sections = Array.isArray(o.sections)
        ? o.sections.map((s) => {
            const sec = s && typeof s === "object" ? (s as Record<string, unknown>) : {};
            const items = Array.isArray(sec.items)
              ? sec.items.map((it) => {
                  const row = it && typeof it === "object" ? (it as Record<string, unknown>) : {};
                  return {
                    title: String(row.title || "").trim(),
                    description: String(row.description || "").trim() || undefined,
                    href: String(row.href || "").trim(),
                    kind: row.kind === "pdf" ? ("pdf" as const) : row.kind === "link" ? ("link" as const) : undefined,
                  };
                })
              : [];
            return { title: String(sec.title || "").trim(), items };
          })
        : [];
      return {
        level,
        label: String(o.label || level).trim(),
        accent,
        sections,
      };
    })
    .filter((x) => x.sections.length > 0);
}

function parseSlots(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => {
      const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const id = String(o.id || `slot-${i + 1}`).trim();
      const label = String(o.label || `Créneau ${i + 1}`).trim();
      const startAt = String(o.startAt || "").trim();
      const endAt = String(o.endAt || "").trim();
      if (!startAt) return null;
      const maxPlaces = Number(o.maxPlaces);
      return {
        id,
        label,
        startAt,
        endAt: endAt || startAt,
        maxPlaces: Number.isFinite(maxPlaces) && maxPlaces > 0 ? maxPlaces : undefined,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

export function parseToolboxConfig(raw: unknown): ToolboxConfig {
  const defaults = defaultToolboxConfig();
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const tools = o.tools && typeof o.tools === "object" ? (o.tools as Record<string, unknown>) : {};

  const qr = tools.qrcreator && typeof tools.qrcreator === "object" ? (tools.qrcreator as Record<string, unknown>) : {};
  const santa =
    tools["secret-santa"] && typeof tools["secret-santa"] === "object"
      ? (tools["secret-santa"] as Record<string, unknown>)
      : {};
  const rentree =
    tools.rentree && typeof tools.rentree === "object" ? (tools.rentree as Record<string, unknown>) : {};
  const tarifs =
    tools["simulateur-tarifs"] && typeof tools["simulateur-tarifs"] === "object"
      ? (tools["simulateur-tarifs"] as Record<string, unknown>)
      : {};
  const fournitures =
    tools["simulateur-fournitures"] && typeof tools["simulateur-fournitures"] === "object"
      ? (tools["simulateur-fournitures"] as Record<string, unknown>)
      : {};
  const po =
    tools["portes-ouvertes"] && typeof tools["portes-ouvertes"] === "object"
      ? (tools["portes-ouvertes"] as Record<string, unknown>)
      : {};

  const ens = tarifs.enseignement && typeof tarifs.enseignement === "object" ? tarifs.enseignement : {};
  const demi = tarifs.demiPension && typeof tarifs.demiPension === "object" ? tarifs.demiPension : {};

  return {
    tools: {
      qrcreator: { enabled: qr.enabled !== false },
      "secret-santa": {
        enabled: santa.enabled === true,
        title: String(santa.title || defaults.tools["secret-santa"].title).trim(),
        budgetHint: String(santa.budgetHint || defaults.tools["secret-santa"].budgetHint).trim(),
        participantNames: Array.isArray(santa.participantNames)
          ? santa.participantNames.map((n) => String(n).trim()).filter(Boolean)
          : [],
      },
      rentree: {
        enabled: rentree.enabled === true,
        title: String(rentree.title || defaults.tools.rentree.title).trim(),
        schoolYear: String(rentree.schoolYear || defaults.tools.rentree.schoolYear).trim(),
        showSimulateurTarifs: rentree.showSimulateurTarifs !== false,
        showSimulateurFournitures: rentree.showSimulateurFournitures !== false,
        links: parseRentreeLinks(rentree.links),
      },
      "simulateur-tarifs": {
        enabled: tarifs.enabled === true,
        schoolYear: String(tarifs.schoolYear || defaults.tools["simulateur-tarifs"].schoolYear).trim(),
        enseignement: {
          maternelle: numArr((ens as Record<string, unknown>).maternelle).length
            ? numArr((ens as Record<string, unknown>).maternelle)
            : defaults.tools["simulateur-tarifs"].enseignement.maternelle,
          elementaire: numArr((ens as Record<string, unknown>).elementaire).length
            ? numArr((ens as Record<string, unknown>).elementaire)
            : defaults.tools["simulateur-tarifs"].enseignement.elementaire,
          college: numArr((ens as Record<string, unknown>).college).length
            ? numArr((ens as Record<string, unknown>).college)
            : defaults.tools["simulateur-tarifs"].enseignement.college,
          lycee: numArr((ens as Record<string, unknown>).lycee).length
            ? numArr((ens as Record<string, unknown>).lycee)
            : defaults.tools["simulateur-tarifs"].enseignement.lycee,
        },
        demiPension: {
          maternelle: Object.keys(numRecord((demi as Record<string, unknown>).maternelle)).length
            ? numRecord((demi as Record<string, unknown>).maternelle)
            : defaults.tools["simulateur-tarifs"].demiPension.maternelle,
          elementaire: Object.keys(numRecord((demi as Record<string, unknown>).elementaire)).length
            ? numRecord((demi as Record<string, unknown>).elementaire)
            : defaults.tools["simulateur-tarifs"].demiPension.elementaire,
          college: Object.keys(numRecord((demi as Record<string, unknown>).college)).length
            ? numRecord((demi as Record<string, unknown>).college)
            : defaults.tools["simulateur-tarifs"].demiPension.college,
          lycee: Object.keys(numRecord((demi as Record<string, unknown>).lycee)).length
            ? numRecord((demi as Record<string, unknown>).lycee)
            : defaults.tools["simulateur-tarifs"].demiPension.lycee,
        },
        pensionAnnuel: Number.isFinite(Number(tarifs.pensionAnnuel))
          ? Number(tarifs.pensionAnnuel)
          : defaults.tools["simulateur-tarifs"].pensionAnnuel,
        garderie: Object.keys(numRecord(tarifs.garderie)).length
          ? numRecord(tarifs.garderie)
          : defaults.tools["simulateur-tarifs"].garderie,
      },
      "simulateur-fournitures": { enabled: fournitures.enabled === true },
      "portes-ouvertes": {
        enabled: po.enabled === true,
        title: String(po.title || defaults.tools["portes-ouvertes"].title).trim(),
        intro: String(po.intro || defaults.tools["portes-ouvertes"].intro).trim(),
        address: String(po.address || "").trim(),
        mapsUrl: String(po.mapsUrl || "").trim() || undefined,
        notifyEmail: String(po.notifyEmail || "").trim() || undefined,
        slots: parseSlots(po.slots),
        consentLabel: String(po.consentLabel || defaults.tools["portes-ouvertes"].consentLabel).trim(),
      },
    },
  };
}

export async function getToolboxConfig(): Promise<ToolboxConfig> {
  const raw = await getJson<unknown>(TOOLBOX_KEY);
  if (!raw?.data) return defaultToolboxConfig();
  return parseToolboxConfig(raw.data);
}

export async function saveToolboxConfig(config: ToolboxConfig): Promise<void> {
  await putJson(TOOLBOX_KEY, config);
}

export function toolboxEnabledTools(config: ToolboxConfig): ToolboxToolId[] {
  const ids: ToolboxToolId[] = [];
  if (config.tools.qrcreator.enabled) ids.push("qrcreator");
  if (config.tools["secret-santa"].enabled) ids.push("secret-santa");
  if (config.tools.rentree.enabled) ids.push("rentree");
  if (config.tools["simulateur-tarifs"].enabled) ids.push("simulateur-tarifs");
  if (config.tools["simulateur-fournitures"].enabled) ids.push("simulateur-fournitures");
  if (config.tools["portes-ouvertes"].enabled) ids.push("portes-ouvertes");
  return ids;
}

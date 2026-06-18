import { getMistralApiKey } from "@/app/lib/tenant-config";
import type {
  AcademicDeadline,
  AcademicDeadlineCategory,
  AcademicDeadlineKind,
} from "@/app/lib/academic-deadlines";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

const CATEGORIES: AcademicDeadlineCategory[] = [
  "mutation_intra",
  "mutation_inter",
  "examens",
  "parcoursup",
  "affectation",
  "rentree",
  "autre",
];

const KINDS: AcademicDeadlineKind[] = ["deadline", "window_start", "window_end", "ongoing"];

type MistralDeadline = {
  title?: string;
  detail?: string;
  date?: string;
  endDate?: string;
  category?: string;
  kind?: string;
  platform?: string;
  sourceUrl?: string;
};

type MistralPayload = {
  deadlines?: MistralDeadline[];
};

function normalizeDate(raw?: string): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const fr = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (fr) {
    const [, d, m, y] = fr;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function normalizeCategory(raw?: string): AcademicDeadlineCategory {
  const v = raw?.trim().toLowerCase() as AcademicDeadlineCategory;
  return CATEGORIES.includes(v) ? v : "autre";
}

function normalizeKind(raw?: string, endDate?: string): AcademicDeadlineKind {
  const v = raw?.trim().toLowerCase() as AcademicDeadlineKind;
  if (KINDS.includes(v)) return v;
  return endDate ? "ongoing" : "deadline";
}

function normalizeDeadline(
  raw: MistralDeadline,
  index: number,
  options?: { sourceLabel?: string; defaultSourceUrl?: string },
): AcademicDeadline | null {
  const title = raw.title?.trim();
  const date = normalizeDate(raw.date);
  if (!title || !date) return null;
  const endDate = normalizeDate(raw.endDate) ?? undefined;
  const sourceUrl = raw.sourceUrl?.trim() || options?.defaultSourceUrl?.trim() || undefined;
  return {
    id: `custom-${Date.now()}-${index}`,
    title,
    detail: raw.detail?.trim() || undefined,
    category: normalizeCategory(raw.category),
    kind: normalizeKind(raw.kind, endDate),
    date,
    endDate,
    platform: raw.platform?.trim() || undefined,
    sourceUrl,
    sourceLabel: options?.sourceLabel,
    schoolYear: "2025-2026",
  };
}

export async function parseAcademicDeadlinesWithMistral(
  ocrText: string,
  options?: { sourceLabel?: string; defaultSourceUrl?: string },
): Promise<AcademicDeadline[]> {
  const apiKey = await getMistralApiKey();
  if (!apiKey) {
    throw new Error("Clé Mistral non configurée — impossible d'analyser le document.");
  }

  const prompt =
    `Tu analyses une circulaire, note de service ou calendrier académique (rectorat, académie de Normandie, DSDEN).\n` +
    `Extrais UNIQUEMENT les échéances administratives actionnables avec une date (ou une période) : mutations, remontées Colibris/SIAM/I-Prof, examens, Parcoursup, affectation élèves, rentrée, TRMD, CSA, dépôts sur plateformes, etc.\n` +
    `Pour chaque échéance, formule un titre court du type « Avant le …, faire … ». Infère l'année (2026 ou 2027) si elle n'est pas écrite.\n` +
    `Réponds UNIQUEMENT en JSON valide :\n` +
    `{\n` +
    `  "deadlines": [\n` +
    `    {\n` +
    `      "title": "intitulé court actionnable",\n` +
    `      "detail": "précision utile pour l'équipe admin",\n` +
    `      "date": "YYYY-MM-DD (début ou date limite)",\n` +
    `      "endDate": "YYYY-MM-DD ou vide si un seul jour",\n` +
    `      "category": "mutation_intra|mutation_inter|examens|parcoursup|affectation|rentree|autre",\n` +
    `      "kind": "deadline|ongoing",\n` +
    `      "platform": "Colibris, SIAM, Parcoursup… ou vide",\n` +
    `      "sourceUrl": "URL https:// si présente dans le texte, sinon vide"\n` +
    `    }\n` +
    `  ]\n` +
    `}\n` +
    `Règles : dates au format ISO, une entrée par échéance distincte, pas de texte hors JSON, ignore les passages sans date claire.\n\n` +
    `Texte OCR du document :\n${ocrText.slice(0, 28_000)}`;

  const res = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mistral : ${err.slice(0, 200)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Réponse IA vide.");

  let parsed: MistralPayload;
  try {
    parsed = JSON.parse(content) as MistralPayload;
  } catch {
    throw new Error("JSON invalide renvoyé par l'IA.");
  }

  const items = (parsed.deadlines ?? [])
    .map((raw, i) => normalizeDeadline(raw, i, options))
    .filter((x): x is AcademicDeadline => x !== null);

  if (items.length === 0) {
    throw new Error("Aucune échéance datée détectée dans ce document.");
  }

  return items;
}

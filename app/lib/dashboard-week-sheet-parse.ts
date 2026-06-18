import { getMistralApiKey } from "@/app/lib/tenant-config";
import {
  normalizeWeekDay,
  parseTimeToMinutes,
} from "@/app/lib/dashboard-week-sheet-time";
import type { WeekSheetData, WeekSheetEvent } from "@/app/lib/dashboard-week-sheet-types";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

type MistralEvent = {
  day?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  location?: string;
  notes?: string;
};

type MistralPayload = {
  weekLabel?: string;
  weekStart?: string;
  events?: MistralEvent[];
};

function normalizeEvent(raw: MistralEvent, index: number): WeekSheetEvent | null {
  const day = raw.day ? normalizeWeekDay(raw.day) : null;
  const title = raw.title?.trim();
  const startTime = raw.startTime?.trim();
  if (!day || !title || !startTime) return null;
  if (parseTimeToMinutes(startTime) === null) return null;
  return {
    id: `ev-${index}`,
    day,
    startTime,
    endTime: raw.endTime?.trim() || undefined,
    title,
    location: raw.location?.trim() || undefined,
    notes: raw.notes?.trim() || undefined,
  };
}

export async function parseWeekSheetWithMistral(ocrText: string): Promise<WeekSheetData> {
  const apiKey = await getMistralApiKey();
  if (!apiKey) {
    throw new Error("Clé Mistral non configurée — impossible d'analyser la feuille.");
  }

  const prompt =
    `Tu analyses une feuille de semaine (planning) d'un établissement scolaire en France.\n` +
    `Extrais TOUS les créneaux / rendez-vous / réunions / activités prévus du lundi au vendredi.\n` +
    `IMPORTANT : chaque activité distincte = une entrée séparée dans events (ex. "Conseil de classe" et "Rendu de bulletins 3e C" sont 2 objets distincts, jamais fusionnés dans un seul title).\n` +
    `Réponds UNIQUEMENT en JSON valide avec ce schéma :\n` +
    `{\n` +
    `  "weekLabel": "Semaine du …",\n` +
    `  "weekStart": "YYYY-MM-DD ou vide",\n` +
    `  "events": [\n` +
    `    {\n` +
    `      "day": "lundi|mardi|mercredi|jeudi|vendredi",\n` +
    `      "startTime": "8h30 ou 08:30",\n` +
    `      "endTime": "9h15 — obligatoire si une plage horaire est indiquée (ex. 8h-12h → 12h)",\n` +
    `      "title": "intitulé court",\n` +
    `      "location": "lieu ou vide",\n` +
    `      "notes": "détail optionnel"\n` +
    `    }\n` +
    `  ]\n` +
    `}\n` +
    `Règles : jours en français, heures au format 8h30 ou 08:30, un seul intitulé par entrée, une seule entrée par créneau avec startTime ET endTime quand la durée est connue, pas de texte hors JSON.\n\n` +
    `Texte OCR de la feuille :\n${ocrText.slice(0, 28_000)}`;

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
    const err = await res.text().catch(() => "");
    throw new Error(`Analyse IA échouée (${res.status})${err ? ` : ${err.slice(0, 200)}` : ""}`);
  }

  const data = await res.json();
  let parsed: MistralPayload;
  try {
    parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}") as MistralPayload;
  } catch {
    throw new Error("Réponse IA illisible.");
  }

  const events = (parsed.events ?? [])
    .map((ev, i) => normalizeEvent(ev, i))
    .filter((ev): ev is WeekSheetEvent => ev !== null);

  if (events.length === 0) {
    throw new Error("Aucun créneau reconnu dans la feuille — vérifiez le PDF.");
  }

  return {
    weekLabel: parsed.weekLabel?.trim() || undefined,
    weekStart: parsed.weekStart?.trim() || undefined,
    events,
    rawTextPreview: ocrText.slice(0, 500),
  };
}

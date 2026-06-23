import * as XLSX from "xlsx";
import type { EleveConfig } from "@/app/lib/eleves-config";
import { validateElevesJson } from "@/app/lib/eleves-config";

export type ElevesImportSource = "pronote" | "ecoledirecte" | "auto";

export type ElevesImportResult =
  | { ok: true; eleves: EleveConfig[]; detectedSource: ElevesImportSource; headerRow: number }
  | { ok: false; error: string };

type FieldKey =
  | "nom"
  | "prenom"
  | "ine"
  | "classe"
  | "mef"
  | "email"
  | "parentEmail"
  | "parent1Email"
  | "parent2Email"
  | "folderName";

const COLUMN_ALIASES: Record<FieldKey, string[]> = {
  nom: [
    "nom",
    "nom eleve",
    "nom élève",
    "nom de l'eleve",
    "nom de l'élève",
    "nom_eleve",
    "nom_eleve",
    "name",
    "nom famille",
    "nom de famille",
  ],
  prenom: [
    "prenom",
    "prénom",
    "prenom eleve",
    "prénom élève",
    "prenom de l'eleve",
    "prénom de l'élève",
    "prenom_eleve",
    "first name",
    "firstname",
  ],
  ine: [
    "ine",
    "identifiant national",
    "identifiant national eleve",
    "id national",
    "n° ine",
    "no ine",
  ],
  classe: ["classe", "division", "groupe", "classe eleve", "classe élève", "class"],
  mef: ["mef", "code mef", "formation", "filiere", "filière", "parcours", "option"],
  email: ["email", "e-mail", "mail", "courriel", "email eleve", "email élève"],
  parentEmail: [
    "email parent",
    "e-mail parent",
    "mail parent",
    "responsable legal",
    "responsable légal",
    "email responsable",
    "courriel parent",
  ],
  parent1Email: [
    "email parent 1",
    "e-mail parent 1",
    "mail parent 1",
    "parent1",
    "parent 1 email",
    "email tuteur 1",
  ],
  parent2Email: [
    "email parent 2",
    "e-mail parent 2",
    "mail parent 2",
    "parent2",
    "parent 2 email",
    "email tuteur 2",
  ],
  folderName: ["foldername", "dossier", "nom dossier", "nom du dossier"],
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchColumn(header: string, source: ElevesImportSource): FieldKey | null {
  const h = normalizeHeader(header);
  if (!h) return null;

  const priority: FieldKey[] =
    source === "ecoledirecte"
      ? [
          "nom",
          "prenom",
          "ine",
          "classe",
          "mef",
          "email",
          "parentEmail",
          "parent1Email",
          "parent2Email",
          "folderName",
        ]
      : [
          "nom",
          "prenom",
          "ine",
          "classe",
          "mef",
          "email",
          "parentEmail",
          "parent1Email",
          "parent2Email",
          "folderName",
        ];

  for (const field of priority) {
    for (const alias of COLUMN_ALIASES[field]) {
      const a = normalizeHeader(alias);
      if (h === a || h.includes(a) || a.includes(h)) {
        return field;
      }
    }
  }
  return null;
}

function buildColumnMap(
  headers: unknown[],
  source: ElevesImportSource,
): Partial<Record<FieldKey, number>> {
  const map: Partial<Record<FieldKey, number>> = {};
  headers.forEach((h, idx) => {
    const field = matchColumn(String(h), source);
    if (field && map[field] === undefined) {
      map[field] = idx;
    }
  });
  return map;
}

function detectHeaderRow(rows: unknown[][], source: ElevesImportSource): number {
  let bestRow = 0;
  let bestScore = 0;
  const scan = Math.min(rows.length, 15);
  for (let i = 0; i < scan; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const map = buildColumnMap(row, source);
    const score =
      (map.nom !== undefined ? 2 : 0) +
      (map.prenom !== undefined ? 2 : 0) +
      (map.ine !== undefined ? 1 : 0) +
      (map.classe !== undefined ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestRow = i;
    }
  }
  return bestRow;
}

function cellStr(row: unknown[], index?: number): string {
  if (index === undefined || index < 0) return "";
  const v = row[index];
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function buildFolderName(nom: string, prenom: string, classe: string): string {
  const base = `${nom} — ${prenom}`.trim();
  return classe ? `${base} — ${classe}` : base;
}

function parseRowsToEleves(
  rows: unknown[][],
  source: ElevesImportSource,
): { eleves: EleveConfig[]; headerRow: number } | { error: string } {
  if (!rows.length) return { error: "Fichier Excel vide." };

  const headerRow = detectHeaderRow(rows, source);
  const headers = rows[headerRow];
  if (!Array.isArray(headers)) return { error: "En-têtes introuvables." };

  const colMap = buildColumnMap(headers, source);
  if (colMap.nom === undefined || colMap.prenom === undefined) {
    return {
      error:
        "Colonnes « Nom » et « Prénom » introuvables. Vérifiez que la 1re ligne du fichier est bien la ligne d'en-tête (titres des colonnes), puis l'ordre : Nom, Prénom, Classe, INE, Code MEF, e-mail élève, e-mail parent.",
    };
  }

  const eleves: EleveConfig[] = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    const nom = cellStr(row, colMap.nom);
    const prenom = cellStr(row, colMap.prenom);
    if (!nom && !prenom) continue;
    if (!nom || !prenom) continue;

    const classe = cellStr(row, colMap.classe);
    const folderName =
      cellStr(row, colMap.folderName) || buildFolderName(nom, prenom, classe);

    const entry: EleveConfig = {
      ine: cellStr(row, colMap.ine),
      nom,
      prenom,
      folderName,
    };
    if (classe) entry.classe = classe;
    const mef = cellStr(row, colMap.mef);
    if (mef) entry.mef = mef;
    const email = cellStr(row, colMap.email);
    if (email) entry.email = email;
    const parentEmail = cellStr(row, colMap.parentEmail);
    if (parentEmail) entry.parentEmail = parentEmail;
    const p1 = cellStr(row, colMap.parent1Email);
    if (p1) entry.parent1Email = p1;
    const p2 = cellStr(row, colMap.parent2Email);
    if (p2) entry.parent2Email = p2;

    eleves.push(entry);
  }

  if (!eleves.length) {
    return { error: "Aucun élève lu — vérifiez que le fichier contient des lignes de données." };
  }

  return { eleves, headerRow };
}

function detectSourceFromHeaders(headers: unknown[]): ElevesImportSource {
  const joined = headers.map((h) => normalizeHeader(h)).join(" | ");
  if (joined.includes("ecole directe") || joined.includes("ecoledirecte")) {
    return "ecoledirecte";
  }
  if (joined.includes("pronote")) return "pronote";
  return "auto";
}

export function parseElevesExcelBuffer(
  buffer: ArrayBuffer,
  source: ElevesImportSource = "auto",
): ElevesImportResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  } catch {
    return { ok: false, error: "Fichier Excel illisible." };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { ok: false, error: "Aucune feuille dans le fichier Excel." };

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  let resolvedSource = source;
  if (source === "auto" && rows[0]) {
    const headerGuess = detectHeaderRow(rows, "auto");
    resolvedSource = detectSourceFromHeaders(rows[headerGuess] ?? rows[0]);
  }

  const parsed = parseRowsToEleves(rows, resolvedSource);
  if ("error" in parsed) {
    return { ok: false, error: parsed.error };
  }

  const validated = validateElevesJson(parsed.eleves);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  return {
    ok: true,
    eleves: validated.eleves,
    detectedSource: resolvedSource,
    headerRow: parsed.headerRow,
  };
}

export function parseElevesJsonText(text: string): ElevesImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "JSON invalide." };
  }
  const validated = validateElevesJson(data);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }
  return {
    ok: true,
    eleves: validated.eleves,
    detectedSource: "auto",
    headerRow: 0,
  };
}

export type ElevesMergeStats = {
  total: number;
  added: number;
  updated: number;
  kept: number;
};

/** Clé de rapprochement pour fusionner deux listes élèves. */
export function eleveMatchKey(e: EleveConfig): string {
  const ine = e.ine?.trim().toUpperCase();
  if (ine) return `ine:${ine}`;
  const folder = e.folderName?.trim();
  if (folder) return `folder:${folder}`;
  return `nom:${e.nom.trim().toUpperCase()}§${e.prenom.trim().toUpperCase()}§${(e.classe ?? "").trim().toUpperCase()}`;
}

/**
 * Fusionne l'import dans la liste existante : mises à jour par INE (ou nom de dossier / identité),
 * nouveaux ajoutés, élèves absents du fichier importé conservés.
 */
export function mergeElevesLists(
  existing: EleveConfig[],
  incoming: EleveConfig[],
): { eleves: EleveConfig[]; stats: ElevesMergeStats } {
  const map = new Map<string, EleveConfig>();
  for (const e of existing) {
    map.set(eleveMatchKey(e), e);
  }

  const incomingKeys = new Set<string>();
  let added = 0;
  let updated = 0;

  for (const inc of incoming) {
    const key = eleveMatchKey(inc);
    incomingKeys.add(key);
    if (map.has(key)) {
      map.set(key, { ...map.get(key)!, ...inc });
      updated++;
    } else {
      map.set(key, inc);
      added++;
    }
  }

  let kept = 0;
  for (const e of existing) {
    if (!incomingKeys.has(eleveMatchKey(e))) kept++;
  }

  return {
    eleves: [...map.values()],
    stats: {
      total: map.size,
      added,
      updated,
      kept,
    },
  };
}

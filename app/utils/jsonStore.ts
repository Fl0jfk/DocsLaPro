import { promises as fs } from "fs";
import path from "path";

const FILE = path.resolve(process.cwd(), "absences_en_attente.json");

export type AbsenceEntry = {
  id: string;
  type: "prof" | "salarie";
  cible: "direction_ecole" | "direction_college" | "direction_lycee";
  nom: string;
  email: string;
  date_debut: string;
  date_fin: string;
  motif: string;
  commentaire?: string;
  justificatif_filename?: string;
  justificatif_buffer?: string;
  justificatifs?: { filename: string; buffer: string; type: string }[];
  justificatif_type?: string;
  etat: "en_attente" | "validee" | "refusee";
  date_declaration: string;
};

export async function readStore(): Promise<AbsenceEntry[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as AbsenceEntry[];
  } catch {
    return [];
  }
}

export async function writeStore(entries: AbsenceEntry[]) {
  await fs.writeFile(FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export async function addEntry(entry: AbsenceEntry) {
  const entries = await readStore();
  entries.push(entry);
  await writeStore(entries);
}

export async function removeEntry(id: string) {
  const entries = await readStore();
  const out = entries.filter(e => e.id !== id);
  await writeStore(out);
}
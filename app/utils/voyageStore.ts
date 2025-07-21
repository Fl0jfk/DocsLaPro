import { promises as fs } from "fs";
import path from "path";

const FILE = path.resolve(process.cwd(), "voyages_en_attente.json");

export type VoyagePieceJointe = {
  filename: string;
  buffer: string;    // base64
  type: string;
};

export type DevisTransporteur = {
  filename: string;
  buffer: string;
  type: string;
  date: string;
  transporteur?: string;
  message?: string;
};

  export type VoyageEntry = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  direction_cible: string;
  date_depart: string;
  date_retour: string;
  lieu: string;
  activite: string;
  classes: string;
  effectif_eleves: number;
  effectif_accompagnateurs: number;
  commentaire?: string;
  devis?: DevisTransporteur[];
  pieces_jointes?: VoyagePieceJointe[];
  etat: "en_attente" | "validee" | "refusee" | "etape_2_en_attente"| "etape_3_en_attente";
  date_declaration: string;
  programme?: {
    filename: string;
    buffer: string;
    type: string;
    } | null;
  etape_2?: {
    panier_repas: boolean;
    details_panier_repas?: string;
    nb_repas?: number;
    nb_vegetariens?: number;
    lieu_repas?: string;
    devis_transporteur: boolean;
    details_devis_transporteur?: string;
    commentaire?: string;
    date?: string;
  };
};

export async function readVoyages(): Promise<VoyageEntry[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as VoyageEntry[];
  } catch {
    return [];
  }
}

export async function writeVoyages(entries: VoyageEntry[]) {
  await fs.writeFile(FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export async function addVoyage(entry: VoyageEntry) {
  const entries = await readVoyages();
  entries.push(entry);
  await writeVoyages(entries);
}

export async function removeVoyage(id: string) {
  const entries = await readVoyages();
  const out = entries.filter(e => e.id !== id);
  await writeVoyages(out);
}
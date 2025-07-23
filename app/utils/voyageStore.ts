import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "eu-west-3",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
export const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

const KEY = "voyages_en_attente.json";

export type VoyagePieceJointe = {
  filename: string;
  buffer: string;  
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
  etat: "en_attente" | "etape_2_en_attente" | "etape_3_en_attente" | "validation_finale_en_attente" | "validee_definitive" | "validee" | "refusee";
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
  etape_3?: {
    circulaire_depart?: VoyagePieceJointe[];        
    date_reunion_info?: string;          
    date_envoi_circulaire_parents?: string;
    participation_famille?: number;
    cout_total_voyage?: number;
    liste_eleves?: VoyagePieceJointe[];
    liste_accompagnateurs?: VoyagePieceJointe[];
    autres_pieces?: VoyagePieceJointe[];
    commentaire?: string;
    date?: string;
  };
};

export async function readVoyages(): Promise<VoyageEntry[]> {
  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }));
    const body = await obj.Body?.transformToString();
    return body ? JSON.parse(body) : [];
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e.$metadata?.httpStatusCode === 404) return [];
    throw e;
  }
}

export async function writeVoyages(entries: VoyageEntry[]) {
  await s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: KEY, Body: JSON.stringify(entries, null, 2), ContentType: "application/json"})
  );
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
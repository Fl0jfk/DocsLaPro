import { NextRequest, NextResponse } from "next/server";
import { readVoyages, writeVoyages } from "@/app/utils/voyageStore";

const RECIPIENTS_DIRECTION: Record<string, string[]> = {
  direction_ecole: ["flojfk+direction.ecole@gmail.com"],
  direction_college: ["flojfk+direction.college@gmail.com"],
  direction_lycee: ["flojfk+direction.lycee@gmail.com"],
  default: ["secretariat@domaine.fr"],
};
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const id = form.get("id") as string;
  const voyages = await readVoyages();
  const voyageIdx = voyages.findIndex(v => v.id === id);
  if (voyageIdx === -1) return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
  const voyage = voyages[voyageIdx];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function fileToObj(file: File | null): Promise<any | null> {
    if (!file) return null;
    const buf = await file.arrayBuffer();
    return {
      filename: file.name,
      buffer: Buffer.from(buf).toString("base64"),
      type: file.type
    };
  }
  const circulaire_depart = await fileToObj(form.get("circulaire_depart") as File);
  const liste_eleves = await fileToObj(form.get("liste_eleves") as File);
  const liste_accompagnateurs = await fileToObj(form.get("liste_accompagnateurs") as File);
  const autres_files = (form.getAll("autres_pieces").filter(f=>f instanceof File) as File[]);
  const autres_pieces = [];
  for (const f of autres_files) autres_pieces.push(await fileToObj(f));
  const etape_3 = {
    circulaire_depart,
    date_reunion_info: form.get("date_reunion_info") as string,
    date_envoi_circulaire_parents: form.get("date_envoi_circulaire_parents") as string,
    participation_famille: Number(form.get("participation_famille")),
    cout_total_voyage: Number(form.get("cout_total_voyage")),
    liste_eleves,
    liste_accompagnateurs,
    autres_pieces,
    commentaire: form.get("commentaire") as string || "",
    date: new Date().toISOString()
  };
  voyages[voyageIdx] = {
    ...voyage,
    etape_3,
    etat: "validation_finale_en_attente"
  };
  await writeVoyages(voyages);
  const to = RECIPIENTS_DIRECTION[voyage.direction_cible] || RECIPIENTS_DIRECTION.default;
  const subject = `[Voyage scolaire] Validation finale à traiter : ${voyage.lieu} (${voyage.date_depart})`;
  const text = `Un voyage scolaire attend votre validation finale.
                Organisateur: ${voyage.prenom} ${voyage.nom} (${voyage.email})
                Période : du ${voyage.date_depart} au ${voyage.date_retour}
                Lien admin: ${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")}/travels/admin-dashboard
                Détail et documents dans la fiche voyage.`;
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email`, {
    method: "POST",
    body: JSON.stringify({ to, subject, text }),
    headers: { "Content-Type": "application/json" }
  });
  return NextResponse.json({ success: true, message: "Étape 3 transmise à la direction pour validation définitive" });
}
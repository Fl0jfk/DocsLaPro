export type EleveConfig = {
  ine: string;
  nom: string;
  prenom: string;
  folderName: string;
  /** Code ou libellé MEF / formation (export Pronote) — rattachement Lycée / Collège / École. */
  mef?: string;
  /** Alias de mef si l'export nomme la colonne « formation ». */
  formation?: string;
  secteur?: string;
};

export function validateElevesJson(
  data: unknown
): { ok: true; eleves: EleveConfig[] } | { ok: false; error: string } {
  if (!Array.isArray(data)) {
    return { ok: false, error: "Le fichier doit être un tableau JSON." };
  }
  if (data.length === 0) {
    return { ok: false, error: "La liste ne peut pas être vide." };
  }
  const eleves: EleveConfig[] = [];
  const ines = new Set<string>();
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || typeof row !== "object") {
      return { ok: false, error: `Entrée invalide à l'index ${i}.` };
    }
    const o = row as Record<string, unknown>;
    const ine = String(o.ine ?? "").trim();
    const nom = String(o.nom ?? "").trim();
    const prenom = String(o.prenom ?? "").trim();
    const folderName = String(o.folderName ?? "").trim();
    const mef = String(o.mef ?? o.formation ?? "").trim();
    const secteur = String(o.secteur ?? "").trim();
    if (!nom || !prenom || !folderName) {
      return {
        ok: false,
        error: `Ligne ${i + 1} : nom, prenom et folderName sont obligatoires.`,
      };
    }
    if (ine) {
      const key = ine.toUpperCase();
      if (ines.has(key)) {
        return { ok: false, error: `INE en double : ${ine}` };
      }
      ines.add(key);
    }
    eleves.push({
      ine,
      nom,
      prenom,
      folderName,
      ...(mef ? { mef } : {}),
      ...(secteur ? { secteur } : {}),
    });
  }
  return { ok: true, eleves };
}

export function buildTextFromPages(
  pageTexts: Record<string, string>,
  pageStart: number,
  pageEnd: number
): string {
  const parts: string[] = [];
  for (let p = pageStart; p <= pageEnd; p++) {
    const t = pageTexts[String(p)] ?? pageTexts[p as unknown as string];
    if (t?.trim()) {
      parts.push(`--- Page ${p} ---\n${t.trim()}`);
    }
  }
  return parts.join("\n\n");
}

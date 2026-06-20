import type { EleveConfig } from "@/app/lib/eleves-config";
import { getJson } from "@/app/lib/s3-storage";
import { loadMefSecteurMap } from "@/app/lib/mef-secteurs";
import {
  buildElevesPoolForOcrMatching,
  oneDrivePathForEleve,
} from "@/app/lib/onedrive-eleves";
import type { OneDriveUserProfile } from "@/app/lib/onedrive-user-profiles";
import type { StageConvention } from "@/app/lib/stage-types";

const ELEVES_KEY = "eleves.json";

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-\s]+/g, " ")
    .trim();
}

function nameSimilarity(aNom: string, aPrenom: string, bNom: string, bPrenom: string): number {
  const an = normalize(aNom);
  const ap = normalize(aPrenom);
  const bn = normalize(bNom);
  const bp = normalize(bPrenom);
  let score = 0;
  if (an && bn && (an === bn || bn.includes(an) || an.includes(bn))) score += 2;
  if (ap && bp && (ap === bp || bp.includes(ap) || ap.includes(bp))) score += 2;
  return score;
}

async function loadEleves(): Promise<EleveConfig[]> {
  const hit = await getJson<EleveConfig[]>(ELEVES_KEY);
  return Array.isArray(hit?.data) ? hit.data : [];
}

export async function matchEleveForConvention(
  convention: StageConvention,
  odProfile: OneDriveUserProfile | null,
): Promise<{
  matchedEleve: EleveConfig | null;
  folderPath: string | null;
  debug: Record<string, unknown>;
}> {
  const allEleves = await loadEleves();
  const mefMap = await loadMefSecteurMap();
  const { eleves, secteurFilterApplied } = buildElevesPoolForOcrMatching(
    allEleves,
    odProfile,
    mefMap,
  );

  const scored = eleves
    .map((e) => ({
      eleve: e,
      score: nameSimilarity(
        convention.student.lastName,
        convention.student.firstName,
        e.nom,
        e.prenom,
      ),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = scored[0]?.eleve ?? null;
  const folderPath =
    best?.folderName && odProfile
      ? oneDrivePathForEleve(odProfile.basePath, best.folderName)
      : null;

  return {
    matchedEleve: best,
    folderPath,
    debug: {
      totalEleves: allEleves.length,
      poolSize: eleves.length,
      secteurFilterApplied,
      candidates: scored.slice(0, 3).map((s) => ({
        nom: s.eleve.nom,
        prenom: s.eleve.prenom,
        folderName: s.eleve.folderName,
        score: s.score,
      })),
    },
  };
}

export function conventionOneDriveFileName(convention: StageConvention): string {
  const last = convention.student.lastName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .trim();
  const first = convention.student.firstName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .trim();
  const kind =
    convention.internshipKind === "job_ete"
      ? "Job ete"
      : convention.internshipKind === "pfmp"
        ? "Convention PFMP"
        : "Convention stage";
  const period = `${convention.schedule.periodStart}_${convention.schedule.periodEnd}`.replace(/-/g, "");
  return `${kind} ${period} ${last} ${first}.pdf`;
}

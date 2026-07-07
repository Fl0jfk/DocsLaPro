import type { EleveConfig } from "@/app/lib/eleves-config";
import type {
  ClassAllocationCampaignConfig,
  ClassAllocationRun,
  ClassLevel,
  ParentWish,
  StaffWish,
  StudentScoreEntry,
} from "@/app/lib/class-allocation-types";
import { computeClassStats, scoreWishSatisfaction } from "@/app/lib/class-allocation-scoring";
import { levelFromClasse } from "@/app/lib/class-allocation-storage";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function solveClassAllocation(input: {
  campaign: ClassAllocationCampaignConfig;
  students: EleveConfig[];
  parentWishes: ParentWish[];
  staffWishes: StaffWish[];
  scores: StudentScoreEntry[];
  onlyLevel?: ClassLevel;
}): Omit<ClassAllocationRun, "id" | "campaignId" | "createdAt"> {
  const levelResults: Record<ClassLevel, ReturnType<typeof computeClassStats>[]> = {
    ecole: [],
    college: [],
    lycee: [],
  };
  const scoreMap = new Map(input.scores.map((s) => [s.studentIne, s]));
  const diagnostics: string[] = [];

  for (const lvl of input.campaign.levels) {
    if (input.onlyLevel && lvl.level !== input.onlyLevel) continue;
    const pool = shuffle(
      input.students.filter((s) => levelFromClasse(s.classe, input.campaign) === lvl.level),
    );
    if (!lvl.targetClasses.length || !pool.length) continue;
    const perClass = Math.ceil(pool.length / lvl.targetClasses.length);
    const classes: Record<string, string[]> = Object.fromEntries(
      lvl.targetClasses.map((c) => [c, []]),
    );

    for (const student of pool) {
      const sorted = [...lvl.targetClasses].sort(
        (a, b) => (classes[a]?.length ?? 0) - (classes[b]?.length ?? 0),
      );
      let picked = sorted[0]!;
      for (const c of sorted) {
        if ((classes[c]?.length ?? 0) < perClass) {
          picked = c;
          break;
        }
      }
      classes[picked]!.push(student.ine);
    }

    const entries = lvl.targetClasses.map((c) =>
      computeClassStats(c, classes[c] || [], scoreMap),
    );
    levelResults[lvl.level] = entries;
    const wishScore = scoreWishSatisfaction(
      classes,
      input.parentWishes.filter((w) => w.level === lvl.level),
      input.staffWishes.filter((w) => w.level === lvl.level),
    );
    diagnostics.push(...wishScore.diagnostics.slice(0, 50));
  }

  const flatScore = Object.values(levelResults)
    .flat()
    .reduce((acc, x) => acc + x.stats.avgScore, 0);

  return {
    levelResults,
    diagnostics,
    score: Number(flatScore.toFixed(2)),
  };
}

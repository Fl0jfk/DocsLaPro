import type { ClassAllocationEntry, ParentWish, StaffWish, StudentScoreEntry } from "@/app/lib/class-allocation-types";

export function computeClassStats(
  className: string,
  studentInes: string[],
  scores: Map<string, StudentScoreEntry>,
): ClassAllocationEntry {
  let girls = 0;
  let boys = 0;
  let other = 0;
  let scoreSum = 0;
  let scoreCount = 0;
  for (const ine of studentInes) {
    const s = scores.get(ine);
    if (s?.gender === "F") girls += 1;
    else if (s?.gender === "M") boys += 1;
    else other += 1;
    if (typeof s?.score === "number") {
      scoreSum += s.score;
      scoreCount += 1;
    }
  }
  return {
    className,
    studentInes,
    stats: {
      count: studentInes.length,
      avgScore: scoreCount ? Number((scoreSum / scoreCount).toFixed(2)) : 0,
      girls,
      boys,
      other,
    },
  };
}

export function scoreWishSatisfaction(
  classes: Record<string, string[]>,
  parentWishes: ParentWish[],
  staffWishes: StaffWish[],
): { score: number; diagnostics: string[] } {
  let score = 0;
  const diagnostics: string[] = [];
  const classOf = new Map<string, string>();
  for (const [c, ines] of Object.entries(classes)) for (const i of ines) classOf.set(i, c);

  for (const w of parentWishes) {
    const own = classOf.get(w.studentIne);
    if (!own) continue;
    for (const p of w.preferredStudentInes) {
      if (classOf.get(p) === own) score += 2;
      else diagnostics.push(`Souhait non satisfait ${w.studentIne} avec ${p}`);
    }
    for (const a of w.avoidStudentInes) {
      if (classOf.get(a) !== own) score += 2;
      else {
        score -= 3;
        diagnostics.push(`Refus non respecté ${w.studentIne} avec ${a}`);
      }
    }
  }

  for (const w of staffWishes) {
    const own = classOf.get(w.studentIne);
    if (!own) continue;
    for (const sep of w.separateFromInes) {
      if (classOf.get(sep) !== own) score += 2;
      else {
        score -= 4;
        diagnostics.push(`Séparation staff non respectée ${w.studentIne} / ${sep}`);
      }
    }
  }

  return { score, diagnostics };
}

import type { StageConvention, StageSignature } from "@/app/lib/stage-types";
import { STAGE_SIGNER_ROLE_LABELS } from "@/app/lib/stage-types";

export type PendingStageSignature = {
  conventionId: string;
  signatureId: string;
  role: string;
  roleLabel: string;
  studentName: string;
  className: string;
  companyName: string;
  periodStart: string;
  periodEnd: string;
  signLink: string;
  validatedAt?: string;
};

function signatureAwaitingUser(
  sig: StageSignature,
  convention: StageConvention,
  userEmail: string,
  userId?: string,
): boolean {
  if (sig.status !== "en_attente" || !sig.signToken) return false;

  const email = userEmail.trim().toLowerCase();
  const sigEmail = sig.signEmail?.trim().toLowerCase();
  if (sigEmail && email && sigEmail === email) return true;

  if (sig.role === "professeur_referent") {
    if (userId && convention.teacherReferent.userId === userId) return true;
    const refEmail = convention.teacherReferent.email?.trim().toLowerCase();
    if (refEmail && email && refEmail === email) return true;
  }

  return false;
}

/** Conventions en attente de signature pour l'utilisateur connecté. */
export function listPendingSignaturesForUser(
  conventions: StageConvention[],
  userEmail: string,
  userId?: string,
): PendingStageSignature[] {
  const out: PendingStageSignature[] = [];

  for (const c of conventions) {
    if (c.status !== "signatures_pending") continue;
    for (const sig of c.signatures) {
      if (!signatureAwaitingUser(sig, c, userEmail, userId)) continue;
      out.push({
        conventionId: c.id,
        signatureId: sig.id,
        role: sig.role,
        roleLabel: STAGE_SIGNER_ROLE_LABELS[sig.role],
        studentName: `${c.student.firstName} ${c.student.lastName}`.trim(),
        className: c.student.className,
        companyName: c.company.name,
        periodStart: c.schedule.periodStart,
        periodEnd: c.schedule.periodEnd,
        signLink: `/stages/signer?token=${encodeURIComponent(sig.signToken!)}`,
        validatedAt: c.adminReview?.at,
      });
    }
  }

  out.sort((a, b) => (b.validatedAt || "").localeCompare(a.validatedAt || ""));
  return out;
}

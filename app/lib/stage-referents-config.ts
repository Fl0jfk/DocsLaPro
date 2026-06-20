import { loadAppConfig } from "@/app/lib/app-config";
import { sanitizeDomainPlanningClassesByPole } from "@/app/lib/domain-planning-defaults";
import { getJson, putJson } from "@/app/lib/s3-storage";
import { STAGE_S3, currentStageSchoolYear, type StageConvention } from "@/app/lib/stage-types";

export type StageClassReferentAssignment = {
  className: string;
  clerkUserId: string;
  name: string;
  email: string;
};

export type StageReferentsConfig = {
  schoolYear: string;
  updatedAt: string;
  updatedBy?: string;
  assignments: StageClassReferentAssignment[];
};

function normalizeClassName(className: string): string {
  return className.trim();
}

function classKey(className: string): string {
  return normalizeClassName(className).toLowerCase();
}

export async function listStageReferentClassNames(extra?: string[]): Promise<string[]> {
  const bundle = await loadAppConfig();
  const poles = sanitizeDomainPlanningClassesByPole(bundle.domainPlanning.classesByPole || {});
  const fromPlanning = Object.values(poles).flat();
  const set = new Set<string>();
  for (const c of fromPlanning) {
    const n = normalizeClassName(c);
    if (n) set.add(n);
  }
  for (const c of extra ?? []) {
    const n = normalizeClassName(c);
    if (n) set.add(n);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

export async function getStageReferentsConfig(schoolYear: string): Promise<StageReferentsConfig | null> {
  const hit = await getJson<StageReferentsConfig>(STAGE_S3.referentsConfig(schoolYear));
  if (!hit?.data?.schoolYear) return null;
  return {
    schoolYear: hit.data.schoolYear,
    updatedAt: hit.data.updatedAt,
    updatedBy: hit.data.updatedBy,
    assignments: Array.isArray(hit.data.assignments)
      ? hit.data.assignments
          .map((a) => ({
            className: normalizeClassName(String(a.className ?? "")),
            clerkUserId: String(a.clerkUserId ?? "").trim(),
            name: String(a.name ?? "").trim(),
            email: String(a.email ?? "").trim().toLowerCase(),
          }))
          .filter((a) => a.className && a.clerkUserId && a.email)
      : [],
  };
}

export async function saveStageReferentsConfig(
  config: StageReferentsConfig,
): Promise<StageReferentsConfig> {
  const next: StageReferentsConfig = {
    schoolYear: config.schoolYear,
    updatedAt: new Date().toISOString(),
    updatedBy: config.updatedBy,
    assignments: config.assignments
      .map((a) => ({
        className: normalizeClassName(a.className),
        clerkUserId: a.clerkUserId.trim(),
        name: a.name.trim(),
        email: a.email.trim().toLowerCase(),
      }))
      .filter((a) => a.className && a.clerkUserId && a.name && a.email),
  };
  await putJson(STAGE_S3.referentsConfig(next.schoolYear), next);
  return next;
}

export function findReferentAssignment(
  config: StageReferentsConfig | null | undefined,
  className: string,
): StageClassReferentAssignment | null {
  if (!config || !className.trim()) return null;
  const key = classKey(className);
  return config.assignments.find((a) => classKey(a.className) === key) ?? null;
}

export async function resolveReferentForClass(
  className: string,
  schoolYear?: string,
): Promise<StageClassReferentAssignment | null> {
  const year = schoolYear?.trim() || currentStageSchoolYear();
  const config = await getStageReferentsConfig(year);
  return findReferentAssignment(config, className);
}

export async function ensureConventionReferent(convention: StageConvention): Promise<StageConvention> {
  const hasReferent =
    convention.teacherReferent.name.trim() && convention.teacherReferent.email.trim();
  if (hasReferent) return convention;

  const assignment = await resolveReferentForClass(
    convention.student.className,
    convention.schoolYear,
  );
  if (!assignment) return convention;

  return {
    ...convention,
    teacherReferent: {
      name: assignment.name,
      email: assignment.email,
      userId: assignment.clerkUserId,
    },
  };
}

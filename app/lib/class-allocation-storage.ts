import "server-only";

import { randomUUID } from "crypto";
import { getJson, putJson } from "@/app/lib/s3-storage";
import type {
  ClassAllocationCampaignConfig,
  ClassAllocationRun,
  ClassLevel,
  ParentWish,
  StaffWish,
  StudentScoreEntry,
} from "@/app/lib/class-allocation-types";

const CONFIG_KEY = "settings/modules/class-allocation.json";
const BASE_PREFIX = "class-allocation";

function campaignPrefix(campaignId: string): string {
  return `${BASE_PREFIX}/campaigns/${campaignId}`;
}

function parentWishesKey(campaignId: string): string {
  return `${campaignPrefix(campaignId)}/parent-wishes.json`;
}
function staffWishesKey(campaignId: string): string {
  return `${campaignPrefix(campaignId)}/staff-wishes.json`;
}
function scoresKey(campaignId: string): string {
  return `${campaignPrefix(campaignId)}/scores.json`;
}
function latestRunKey(campaignId: string): string {
  return `${campaignPrefix(campaignId)}/latest-run.json`;
}
function runKey(campaignId: string, runId: string): string {
  return `${campaignPrefix(campaignId)}/runs/${runId}.json`;
}

export function defaultCampaignConfig(): ClassAllocationCampaignConfig {
  return {
    id: new Date().getFullYear().toString(),
    label: `Campagne ${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    isOpen: false,
    levels: [],
    teacherCatalog: [],
  };
}

export async function loadCampaignConfig(): Promise<ClassAllocationCampaignConfig> {
  const hit = await getJson<ClassAllocationCampaignConfig>(CONFIG_KEY);
  return hit?.data ?? defaultCampaignConfig();
}

export async function saveCampaignConfig(config: ClassAllocationCampaignConfig): Promise<void> {
  await putJson(CONFIG_KEY, config);
}

export async function listParentWishes(campaignId: string): Promise<ParentWish[]> {
  const hit = await getJson<ParentWish[]>(parentWishesKey(campaignId));
  return Array.isArray(hit?.data) ? hit.data : [];
}

export async function saveParentWish(wish: ParentWish): Promise<void> {
  const all = await listParentWishes(wish.campaignId);
  const next = all.filter((w) => w.studentIne !== wish.studentIne);
  next.push(wish);
  await putJson(parentWishesKey(wish.campaignId), next);
}

export async function listStaffWishes(campaignId: string): Promise<StaffWish[]> {
  const hit = await getJson<StaffWish[]>(staffWishesKey(campaignId));
  return Array.isArray(hit?.data) ? hit.data : [];
}

export async function saveStaffWish(wish: StaffWish): Promise<void> {
  const all = await listStaffWishes(wish.campaignId);
  const key = `${wish.studentIne}:${wish.actorUserId}`;
  const next = all.filter((w) => `${w.studentIne}:${w.actorUserId}` !== key);
  next.push(wish);
  await putJson(staffWishesKey(wish.campaignId), next);
}

export async function listScores(campaignId: string): Promise<StudentScoreEntry[]> {
  const hit = await getJson<StudentScoreEntry[]>(scoresKey(campaignId));
  return Array.isArray(hit?.data) ? hit.data : [];
}

export async function upsertScores(
  campaignId: string,
  entries: StudentScoreEntry[],
): Promise<void> {
  const all = await listScores(campaignId);
  const map = new Map<string, StudentScoreEntry>();
  for (const e of all) map.set(e.studentIne, e);
  for (const e of entries) map.set(e.studentIne, e);
  await putJson(scoresKey(campaignId), Array.from(map.values()));
}

export async function saveRun(
  campaignId: string,
  run: Omit<ClassAllocationRun, "id" | "campaignId" | "createdAt">,
): Promise<ClassAllocationRun> {
  const full: ClassAllocationRun = {
    id: randomUUID(),
    campaignId,
    createdAt: new Date().toISOString(),
    ...run,
  };
  await putJson(runKey(campaignId, full.id), full);
  await putJson(latestRunKey(campaignId), full);
  return full;
}

export async function loadLatestRun(campaignId: string): Promise<ClassAllocationRun | null> {
  const hit = await getJson<ClassAllocationRun>(latestRunKey(campaignId));
  return hit?.data ?? null;
}

export function levelFromClasse(
  classe: string | undefined,
  config: ClassAllocationCampaignConfig,
): ClassLevel | null {
  const c = String(classe || "").toLowerCase().trim();
  if (!c) return null;
  for (const level of config.levels) {
    const ok = level.sourceClassPrefixes.some((p) => c.startsWith(p.toLowerCase()));
    if (ok) return level.level;
  }
  return null;
}

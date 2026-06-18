import { getJson, putJson } from "@/app/lib/s3-storage";
import {
  ACADEMIC_DEADLINES_STORAGE_PATH,
  type StoredAcademicDeadlinesData,
} from "@/app/lib/dashboard-academic-deadlines-types";
import type { AcademicDeadline } from "@/app/lib/academic-deadlines";

export async function loadCustomAcademicDeadlines(): Promise<AcademicDeadline[]> {
  const hit = await getJson<StoredAcademicDeadlinesData>(ACADEMIC_DEADLINES_STORAGE_PATH);
  if (!hit?.data?.items || !Array.isArray(hit.data.items)) return [];
  return hit.data.items;
}

export async function saveCustomAcademicDeadlines(items: AcademicDeadline[]): Promise<void> {
  const payload: StoredAcademicDeadlinesData = {
    items,
    updatedAt: new Date().toISOString(),
  };
  await putJson(ACADEMIC_DEADLINES_STORAGE_PATH, payload);
}

export async function appendCustomAcademicDeadlines(
  incoming: AcademicDeadline[],
): Promise<AcademicDeadline[]> {
  const existing = await loadCustomAcademicDeadlines();
  const keys = new Set(existing.map((e) => `${e.title}|${e.date}|${e.endDate ?? ""}`));
  const merged = [...existing];
  for (const item of incoming) {
    const key = `${item.title}|${item.date}|${item.endDate ?? ""}`;
    if (keys.has(key)) continue;
    keys.add(key);
    merged.push(item);
  }
  await saveCustomAcademicDeadlines(merged);
  return merged;
}

export async function loadAllAcademicDeadlines(seed: AcademicDeadline[]): Promise<AcademicDeadline[]> {
  const custom = await loadCustomAcademicDeadlines();
  return [...seed, ...custom];
}

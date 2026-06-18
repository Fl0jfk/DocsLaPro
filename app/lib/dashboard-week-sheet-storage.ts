import { getJson, putJson } from "@/app/lib/s3-storage";
import {
  WEEK_SHEET_STORAGE_PATH,
  type WeekSheetData,
} from "@/app/lib/dashboard-week-sheet-types";

export async function loadWeekSheetData(): Promise<WeekSheetData | null> {
  const hit = await getJson<WeekSheetData>(WEEK_SHEET_STORAGE_PATH);
  if (!hit?.data || !Array.isArray(hit.data.events)) return null;
  return hit.data;
}

export async function saveWeekSheetData(data: WeekSheetData): Promise<void> {
  await putJson(WEEK_SHEET_STORAGE_PATH, data);
}

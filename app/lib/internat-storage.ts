import { getJson, putJson, listPrefix } from "@/app/lib/s3-storage";
import {
  INTERNAT_S3,
  emptyRollCall,
  type InternatActivity,
  type InternatAlert,
  type InternatModuleConfig,
  type InternatOuting,
  type InternatOutingIndexEntry,
  type InternatRollCall,
  type InternatRoom,
  type InternatStudent,
} from "@/app/lib/internat-types";
import { outingIndexEntry } from "@/app/lib/internat-outing";

function rollCallKey(date: string) {
  return `${INTERNAT_S3.rollCallPrefix}${date}.json`;
}

function alertKey(id: string) {
  return `${INTERNAT_S3.alertsPrefix}${id}.json`;
}

export async function getInternatRooms(): Promise<InternatRoom[]> {
  const hit = await getJson<InternatRoom[]>(INTERNAT_S3.rooms);
  return Array.isArray(hit?.data) ? hit.data : [];
}

export async function saveInternatRooms(rooms: InternatRoom[]) {
  await putJson(INTERNAT_S3.rooms, rooms);
}

export async function getInternatStudents(): Promise<InternatStudent[]> {
  const hit = await getJson<InternatStudent[]>(INTERNAT_S3.students);
  return Array.isArray(hit?.data) ? hit.data : [];
}

export async function saveInternatStudents(students: InternatStudent[]) {
  await putJson(INTERNAT_S3.students, students);
}

export async function getInternatActivities(): Promise<InternatActivity[]> {
  const hit = await getJson<InternatActivity[]>(INTERNAT_S3.activities);
  return Array.isArray(hit?.data) ? hit.data : [];
}

export async function saveInternatActivities(activities: InternatActivity[]) {
  await putJson(INTERNAT_S3.activities, activities);
}

export async function getInternatRollCall(date: string): Promise<InternatRollCall> {
  const hit = await getJson<InternatRollCall>(rollCallKey(date));
  if (hit?.data) return hit.data;
  return emptyRollCall(date);
}

export async function saveInternatRollCall(rollCall: InternatRollCall) {
  await putJson(rollCallKey(rollCall.date), rollCall);
}

export async function listInternatRollCallDates(): Promise<string[]> {
  const keys = await listPrefix(INTERNAT_S3.rollCallPrefix);
  return keys
    .map((k) => {
      const name = k.split("/").pop() || "";
      return name.replace(/\.json$/, "");
    })
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
}

export async function listValidatedRollCalls(limit = 30): Promise<InternatRollCall[]> {
  const dates = (await listInternatRollCallDates()).reverse().slice(0, limit * 2);
  const out: InternatRollCall[] = [];
  for (const date of dates) {
    const rc = await getInternatRollCall(date);
    if (rc.status === "validee") out.push(rc);
    if (out.length >= limit) break;
  }
  return out;
}

export async function saveInternatAlert(alert: InternatAlert) {
  await putJson(alertKey(alert.id), alert);
}

export async function listInternatAlerts(limit = 50): Promise<InternatAlert[]> {
  const keys = (await listPrefix(INTERNAT_S3.alertsPrefix))
    .filter((k) => k.endsWith(".json"))
    .sort()
    .reverse()
    .slice(0, limit);
  const out: InternatAlert[] = [];
  for (const key of keys) {
    const file = key.split("/").pop() || "";
    const hit = await getJson<InternatAlert>(`${INTERNAT_S3.alertsPrefix}${file}`);
    if (hit?.data) out.push(hit.data);
  }
  return out;
}

export async function getInternatModuleConfig(): Promise<InternatModuleConfig> {
  const hit = await getJson<InternatModuleConfig>(INTERNAT_S3.moduleConfig);
  return hit?.data || { rollCallDeadlineHour: 22, weeklySummaryEnabled: true };
}

export async function saveInternatModuleConfig(config: InternatModuleConfig) {
  await putJson(INTERNAT_S3.moduleConfig, config);
}

function outingKey(id: string) {
  return `${INTERNAT_S3.outingsPrefix}${id}.json`;
}

export async function getInternatOutingsIndex(): Promise<InternatOutingIndexEntry[]> {
  const hit = await getJson<InternatOutingIndexEntry[]>(INTERNAT_S3.outingsIndex);
  return Array.isArray(hit?.data) ? hit.data : [];
}

async function saveInternatOutingsIndex(entries: InternatOutingIndexEntry[]) {
  const sorted = [...entries].sort((a, b) => b.outingDate.localeCompare(a.outingDate) || b.createdAt.localeCompare(a.createdAt));
  await putJson(INTERNAT_S3.outingsIndex, sorted);
}

export async function getInternatOuting(id: string): Promise<InternatOuting | null> {
  const hit = await getJson<InternatOuting>(outingKey(id));
  return hit?.data || null;
}

export async function saveInternatOuting(outing: InternatOuting) {
  await putJson(outingKey(outing.id), outing);
  const index = await getInternatOutingsIndex();
  const entry = outingIndexEntry(outing);
  const idx = index.findIndex((e) => e.id === outing.id);
  if (idx >= 0) index[idx] = entry;
  else index.push(entry);
  await saveInternatOutingsIndex(index);
}

export async function listInternatOutings(limit = 100): Promise<InternatOuting[]> {
  const index = (await getInternatOutingsIndex()).slice(0, limit);
  const out: InternatOuting[] = [];
  for (const e of index) {
    const o = await getInternatOuting(e.id);
    if (o) out.push(o);
  }
  return out;
}

export async function findOutingByToken(token: string): Promise<InternatOuting | null> {
  const outings = await listInternatOutings(200);
  for (const outing of outings) {
    if (outing.status === "cancelled") continue;
    if (outing.directionDecisions.some((d) => d.token === token)) return outing;
    if (outing.participants.some((p) => p.parentToken === token)) return outing;
  }
  return null;
}

export function countStudentsInRoom(students: InternatStudent[], roomId: string) {
  return students.filter((s) => s.actif && s.roomId === roomId).length;
}

export function validateRoomCapacity(
  students: InternatStudent[],
  rooms: InternatRoom[],
  studentId: string,
  roomId: string | null | undefined,
) {
  if (!roomId) return { ok: true as const };
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return { ok: false as const, error: "Chambre introuvable." };
  const others = students.filter((s) => s.actif && s.roomId === roomId && s.id !== studentId).length;
  if (others >= room.capacity) {
    return { ok: false as const, error: `La chambre ${room.label} est pleine (${room.capacity} places).` };
  }
  return { ok: true as const };
}

import {
  parseEstablishmentsFile,
  parseNotifications,
  parseProfRoomModule,
  parseStaffDirectoryFile,
  parseTenantIdentity,
  parseTravelsModule,
  type Establishment,
  type NotificationsConfig,
  type ProfRoomModuleConfig,
  type StaffDirectoryRow,
  type TenantConfigBundle,
  type TenantIdentity,
  type TravelsModuleConfig,
} from "@/app/lib/tenant-config-schemas";
import {
  defaultEstablishments,
  defaultNotifications,
  defaultProfRoomModule,
  defaultStaffDirectory,
  defaultTenantIdentity,
  defaultTravelsModule,
} from "@/app/lib/tenant-config-defaults";
import { getTenantJson, putTenantJson } from "@/app/lib/tenant-s3-storage";

const CACHE_MS = 45_000;
const cache = new Map<string, { at: number; bundle: TenantConfigBundle }>();

export function invalidateTenantConfigCache(orgId: string) {
  cache.delete(orgId);
}

export async function loadTenantConfig(orgId: string): Promise<TenantConfigBundle> {
  const hit = cache.get(orgId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.bundle;

  const [identityRaw, estRaw, notifRaw, staffRaw, travelsRaw, profRaw] = await Promise.all([
    getTenantJson<unknown>(orgId, "settings/tenant.json"),
    getTenantJson<unknown>(orgId, "settings/establishments.json"),
    getTenantJson<unknown>(orgId, "settings/notifications.json"),
    getTenantJson<unknown>(orgId, "settings/staff-directory.json"),
    getTenantJson<unknown>(orgId, "settings/modules/travels.json"),
    getTenantJson<unknown>(orgId, "settings/modules/prof-room.json"),
  ]);

  const identity = identityRaw?.data
    ? parseTenantIdentity(identityRaw.data)
    : defaultTenantIdentity();

  const establishments = estRaw?.data
    ? parseEstablishmentsFile(estRaw.data)
    : defaultEstablishments();

  const notifications = notifRaw?.data
    ? parseNotifications(notifRaw.data)
    : defaultNotifications();

  const staffDirectory = staffRaw?.data
    ? parseStaffDirectoryFile(staffRaw.data)
    : defaultStaffDirectory();

  const travels = travelsRaw?.data
    ? parseTravelsModule(travelsRaw.data)
    : defaultTravelsModule();

  const profRoom = profRaw?.data
    ? parseProfRoomModule(profRaw.data)
    : defaultProfRoomModule();

  const bundle: TenantConfigBundle = {
    identity,
    establishments: establishments.filter((e) => e.active !== false),
    notifications,
    staffDirectory,
    travels,
    profRoom,
  };
  cache.set(orgId, { at: Date.now(), bundle });
  return bundle;
}

export async function saveTenantIdentity(orgId: string, data: TenantIdentity) {
  const parsed = parseTenantIdentity(data);
  await putTenantJson(orgId, "settings/tenant.json", parsed);
  invalidateTenantConfigCache(orgId);
}

export async function saveEstablishments(orgId: string, establishments: Establishment[]) {
  const parsed = establishments.map(parseEstablishment);
  await putTenantJson(orgId, "settings/establishments.json", { establishments: parsed });
  invalidateTenantConfigCache(orgId);
}

export async function saveNotifications(orgId: string, data: NotificationsConfig) {
  const parsed = parseNotifications(data);
  await putTenantJson(orgId, "settings/notifications.json", parsed);
  invalidateTenantConfigCache(orgId);
}

export async function saveStaffDirectory(orgId: string, rows: StaffDirectoryRow[]) {
  const parsed = parseStaffDirectoryFile({ rows });
  await putTenantJson(orgId, "settings/staff-directory.json", { rows: parsed });
  invalidateTenantConfigCache(orgId);
}

export async function saveTravelsModule(orgId: string, data: TravelsModuleConfig) {
  const parsed = parseTravelsModule(data);
  await putTenantJson(orgId, "settings/modules/travels.json", parsed);
  invalidateTenantConfigCache(orgId);
}

export async function saveProfRoomModule(orgId: string, data: ProfRoomModuleConfig) {
  const parsed = parseProfRoomModule(data);
  await putTenantJson(orgId, "settings/modules/prof-room.json", parsed);
  invalidateTenantConfigCache(orgId);
}

export function getEstablishmentByLabel(
  bundle: TenantConfigBundle,
  label: string,
): Establishment | null {
  const t = label.trim();
  return bundle.establishments.find((e) => e.label === t) ?? null;
}

export function getEstablishmentById(
  bundle: TenantConfigBundle,
  id: string,
): Establishment | null {
  return bundle.establishments.find((e) => e.id === id) ?? null;
}

export async function seedTenantSettingsFromDefaults(orgId: string) {
  await saveTenantIdentity(orgId, defaultTenantIdentity());
  await saveEstablishments(orgId, defaultEstablishments());
  await saveNotifications(orgId, defaultNotifications());
  await saveStaffDirectory(orgId, defaultStaffDirectory());
  await saveTravelsModule(orgId, defaultTravelsModule());
  await saveProfRoomModule(orgId, defaultProfRoomModule());
}

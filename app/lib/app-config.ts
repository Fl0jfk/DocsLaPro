import {
  parseDomainPlanningModule,
  parseEstablishment,
  parseEstablishmentsFile,
  parseInternatModule,
  parseNotifications,
  parseProfRoomModule,
  parseStaffDirectoryFile,
  parseSiteIdentity,
  parseTravelsModule,
  type AppConfigBundle,
  type DomainPlanningModuleConfig,
  type Establishment,
  type InternatModuleConfig,
  type NotificationsConfig,
  type ProfRoomModuleConfig,
  type SiteIdentity,
  type StaffDirectoryRow,
  type TravelsModuleConfig,
} from "@/app/lib/app-config-schemas";
import {
  defaultDomainPlanningModule,
  defaultEstablishments,
  defaultInternatModule,
  defaultNotifications,
  defaultProfRoomModule,
  defaultSiteIdentity,
  defaultStaffDirectory,
  defaultTravelsModule,
} from "@/app/lib/app-config-defaults";
import { normalizeDomainPlanningModule } from "@/app/lib/domain-planning-defaults";
import { withDefaultProfRoomSubjects } from "@/app/lib/prof-room-defaults";
import { getJson, putJson } from "@/app/lib/s3-storage";

const CACHE_MS = 45_000;
let cache: { at: number; bundle: AppConfigBundle } | null = null;

export function invalidateAppConfigCache() {
  cache = null;
}

export async function loadAppConfig(): Promise<AppConfigBundle> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.bundle;

  const [identityRaw, estRaw, notifRaw, staffRaw, travelsRaw, profRaw, domainRaw, internatRaw] = await Promise.all([
    getJson<unknown>("settings/site.json"),
    getJson<unknown>("settings/establishments.json"),
    getJson<unknown>("settings/notifications.json"),
    getJson<unknown>("settings/staff-directory.json"),
    getJson<unknown>("settings/modules/travels.json"),
    getJson<unknown>("settings/modules/prof-room.json"),
    getJson<unknown>("settings/modules/domain-planning.json"),
    getJson<unknown>("settings/modules/internat.json"),
  ]);

  const identity = identityRaw?.data ? parseSiteIdentity(identityRaw.data) : defaultSiteIdentity();
  const establishments = estRaw?.data ? parseEstablishmentsFile(estRaw.data) : defaultEstablishments();
  const notifications = notifRaw?.data ? parseNotifications(notifRaw.data) : defaultNotifications();
  const staffDirectory = staffRaw?.data ? parseStaffDirectoryFile(staffRaw.data) : defaultStaffDirectory();
  const travels = travelsRaw?.data ? parseTravelsModule(travelsRaw.data) : defaultTravelsModule();
  const profRoomRaw = profRaw?.data ? parseProfRoomModule(profRaw.data) : defaultProfRoomModule();
  const profRoom = withDefaultProfRoomSubjects(profRoomRaw);
  const domainPlanningRaw = domainRaw?.data
    ? parseDomainPlanningModule(domainRaw.data)
    : defaultDomainPlanningModule();
  const domainPlanning = normalizeDomainPlanningModule(domainPlanningRaw);
  const internat = internatRaw?.data ? parseInternatModule(internatRaw.data) : defaultInternatModule();

  const bundle: AppConfigBundle = {
    identity,
    establishments: establishments.filter((e) => e.active !== false),
    notifications,
    staffDirectory,
    travels,
    profRoom,
    domainPlanning,
    internat,
  };
  cache = { at: Date.now(), bundle };
  return bundle;
}

export async function saveSiteIdentity(data: SiteIdentity) {
  const parsed = parseSiteIdentity(data);
  await putJson("settings/site.json", parsed);
  invalidateAppConfigCache();
}

export async function saveEstablishments(establishments: Establishment[]) {
  const parsed = establishments.map(parseEstablishment);
  await putJson("settings/establishments.json", { establishments: parsed });
  invalidateAppConfigCache();
}

export async function saveNotifications(data: NotificationsConfig) {
  const parsed = parseNotifications(data);
  await putJson("settings/notifications.json", parsed);
  invalidateAppConfigCache();
}

export async function saveStaffDirectory(rows: StaffDirectoryRow[]) {
  const parsed = parseStaffDirectoryFile({ rows });
  await putJson("settings/staff-directory.json", { rows: parsed });
  invalidateAppConfigCache();
}

export async function saveTravelsModule(data: TravelsModuleConfig) {
  const parsed = parseTravelsModule(data);
  await putJson("settings/modules/travels.json", parsed);
  invalidateAppConfigCache();
}

export async function saveProfRoomModule(data: ProfRoomModuleConfig) {
  const parsed = parseProfRoomModule(data);
  await putJson("settings/modules/prof-room.json", parsed);
  invalidateAppConfigCache();
}

export async function saveDomainPlanningModule(data: DomainPlanningModuleConfig) {
  const parsed = normalizeDomainPlanningModule(parseDomainPlanningModule(data));
  await putJson("settings/modules/domain-planning.json", parsed);
  invalidateAppConfigCache();
}

export async function saveInternatModule(data: InternatModuleConfig) {
  const parsed = parseInternatModule(data);
  await putJson("settings/modules/internat.json", parsed);
  invalidateAppConfigCache();
}

export function getEstablishmentByLabel(bundle: AppConfigBundle, label: string): Establishment | null {
  const t = label.trim();
  return bundle.establishments.find((e) => e.label === t) ?? null;
}

export function getEstablishmentById(bundle: AppConfigBundle, id: string): Establishment | null {
  return bundle.establishments.find((e) => e.id === id) ?? null;
}

export async function seedAppSettingsFromDefaults() {
  await saveSiteIdentity(defaultSiteIdentity());
  await saveEstablishments(defaultEstablishments());
  await saveNotifications(defaultNotifications());
  await saveStaffDirectory(defaultStaffDirectory());
  await saveTravelsModule(defaultTravelsModule());
  await saveProfRoomModule(defaultProfRoomModule());
  await saveInternatModule(defaultInternatModule());
}

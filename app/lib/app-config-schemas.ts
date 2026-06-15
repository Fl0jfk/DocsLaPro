/** Types et parseurs légers pour la configuration intranet (sans dépendance externe). */

export type SiteIdentity = {
  name: string;
  shortName?: string;
  /** Logo affiché en haut à gauche (URL publique S3). */
  headerLogoUrl?: string;
  address?: {
    street?: string;
    city?: string;
    zip?: string;
    full?: string;
    fullCompact?: string;
    mapsEmbed?: string;
    mapsItinerary?: string;
  };
  phone?: {
    display?: string;
    tel?: string;
    hours?: string;
  };
  preinscriptionUrl?: string;
  reglementFinancier?: string;
};

export type Establishment = {
  id: string;
  label: string;
  directorName?: string;
  directorEmail?: string;
  grades?: string;
  clerkRoleSlugs?: string[];
  active?: boolean;
};

export type InternatRollCallRecipients = {
  directionLycee?: string;
  cpeLycee?: string;
  cpeCollege?: string;
};

export type NotificationsConfig = {
  travelsCompta: string[];
  travelsCuisine?: string;
  travelsZeendoc?: string;
  hseOps?: string;
  photocopiesOps?: string;
  absencesNotifyProfEcole?: { label?: string; email: string };
  absencesNotifyProfCollegeLycee?: { label?: string; email: string };
  absencesNotifyOgecCompta: string[];
  internatRollCallRecipients?: InternatRollCallRecipients;
  internatEmergencyRecipients?: string[];
};

export type InternatModuleConfig = {
  rollCallDeadlineHour?: number;
  rollCallReminderHour?: number;
  rollCallReminderEnabled?: boolean;
  weeklySummaryEnabled?: boolean;
  weeklyParentDigestEnabled?: boolean;
  weeklyParentDigestWeekday?: number;
  weeklyParentDigestLastSent?: string;
};

export type StaffDirectoryRow = {
  email: string;
  branchId: string;
  role: "leader" | "executor";
  validUntil?: string;
};

export type TravelsModuleConfig = {
  comptaEmails: string[];
  transportProviders: { name: string; email: string }[];
};

export type ProfRoomModuleConfig = {
  classesByPole: Record<string, string[]>;
  subjectColors: Record<string, string>;
  hoursStart: number;
  hoursEnd: number;
  bookingHorizonDays: number;
  /** Utilisateurs Clerk autorisés comme administrateurs du module. */
  adminClerkUserIds: string[];
};

export type DomainPlanningModuleConfig = {
  classesByPole: Record<string, string[]>;
  activityColors: Record<string, string>;
  hoursStart: number;
  hoursEnd: number;
  bookingHorizonDays: number;
};

export type RoutingService = {
  id: string;
  label: string;
  category: string;
  manualOnly?: boolean;
};

export type RoutingTask = {
  id: string;
  label: string;
  hint: string;
  keywords: string[];
  active: boolean;
};

export type RoutingAssignment = {
  id: string;
  taskId: string;
  email: string;
  personName: string;
  serviceId: string;
  active: boolean;
};

export type RoutingDirectionQueue = {
  id: string;
  label: string;
  email: string;
  active: boolean;
};

export type RequestsRoutingConfig = {
  version: 1;
  services: RoutingService[];
  tasks: RoutingTask[];
  assignments: RoutingAssignment[];
  directionQueues: RoutingDirectionQueue[];
};

export type AppConfigBundle = {
  identity: SiteIdentity;
  establishments: Establishment[];
  notifications: NotificationsConfig;
  staffDirectory: StaffDirectoryRow[];
  travels: TravelsModuleConfig;
  profRoom: ProfRoomModuleConfig;
  domainPlanning: DomainPlanningModuleConfig;
  internat: InternatModuleConfig;
  requestsRouting?: RequestsRoutingConfig;
};

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x).trim()).filter(Boolean);
}

export function parseSiteIdentity(raw: unknown): SiteIdentity {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const addr = o.address && typeof o.address === "object" ? (o.address as Record<string, unknown>) : {};
  const phone = o.phone && typeof o.phone === "object" ? (o.phone as Record<string, unknown>) : {};
  const name = str(o.name).trim();
  if (!name) throw new Error("Le nom du groupe est requis.");
  return {
    name,
    shortName: str(o.shortName) || undefined,
    address: {
      street: str(addr.street) || undefined,
      city: str(addr.city) || undefined,
      zip: str(addr.zip) || undefined,
      full: str(addr.full) || undefined,
      fullCompact: str(addr.fullCompact) || undefined,
      mapsEmbed: str(addr.mapsEmbed) || undefined,
      mapsItinerary: str(addr.mapsItinerary) || undefined,
    },
    phone: {
      display: str(phone.display) || undefined,
      tel: str(phone.tel) || undefined,
      hours: str(phone.hours) || undefined,
    },
    preinscriptionUrl: str(o.preinscriptionUrl) || undefined,
    reglementFinancier: str(o.reglementFinancier) || undefined,
    headerLogoUrl: str(o.headerLogoUrl).trim() || undefined,
  };
}

export function parseEstablishment(raw: unknown): Establishment {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const id = str(o.id).trim();
  const label = str(o.label).trim();
  if (!id || !label) throw new Error("Chaque établissement doit avoir un id et un libellé.");
  const email = str(o.directorEmail).trim();
  if (email && !isEmail(email)) throw new Error(`Email direction invalide pour ${label}.`);
  return {
    id,
    label,
    directorName: str(o.directorName) || undefined,
    directorEmail: email || undefined,
    grades: str(o.grades) || undefined,
    clerkRoleSlugs: strArr(o.clerkRoleSlugs),
    active: o.active !== false,
  };
}

export function parseEstablishmentsFile(raw: unknown): Establishment[] {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(o.establishments) ? o.establishments : Array.isArray(raw) ? raw : [];
  return list.map(parseEstablishment);
}

export function parseNotifications(raw: unknown): NotificationsConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const compta = strArr(o.travelsCompta).filter(isEmail);
  const ogec = strArr(o.absencesNotifyOgecCompta).filter(isEmail);
  const parseNotify = (block: unknown) => {
    if (!block || typeof block !== "object") return undefined;
    const b = block as Record<string, unknown>;
    const email = str(b.email).trim();
    if (!email || !isEmail(email)) return undefined;
    return { label: str(b.label) || undefined, email };
  };
  const parseInternatRollCall = (block: unknown): InternatRollCallRecipients | undefined => {
    if (!block || typeof block !== "object") return undefined;
    const b = block as Record<string, unknown>;
    const out: InternatRollCallRecipients = {};
    const d = str(b.directionLycee).trim();
    const cL = str(b.cpeLycee).trim();
    const cC = str(b.cpeCollege).trim();
    if (d && isEmail(d)) out.directionLycee = d;
    if (cL && isEmail(cL)) out.cpeLycee = cL;
    if (cC && isEmail(cC)) out.cpeCollege = cC;
    return Object.keys(out).length ? out : undefined;
  };

  return {
    travelsCompta: compta,
    travelsCuisine: str(o.travelsCuisine) || undefined,
    travelsZeendoc: str(o.travelsZeendoc) || undefined,
    hseOps: str(o.hseOps) || undefined,
    photocopiesOps: str(o.photocopiesOps) || undefined,
    absencesNotifyProfEcole: parseNotify(o.absencesNotifyProfEcole),
    absencesNotifyProfCollegeLycee: parseNotify(o.absencesNotifyProfCollegeLycee),
    absencesNotifyOgecCompta: ogec,
    internatRollCallRecipients: parseInternatRollCall(o.internatRollCallRecipients),
    internatEmergencyRecipients: strArr(o.internatEmergencyRecipients).filter(isEmail),
  };
}

export function parseInternatModule(raw: unknown): InternatModuleConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const hour = Number(o.rollCallDeadlineHour);
  const reminderHour = Number(o.rollCallReminderHour);
  const weekday = Number(o.weeklyParentDigestWeekday);
  return {
    rollCallDeadlineHour: Number.isFinite(hour) ? hour : 22,
    rollCallReminderHour: Number.isFinite(reminderHour) ? reminderHour : 21,
    rollCallReminderEnabled: o.rollCallReminderEnabled !== false,
    weeklySummaryEnabled: o.weeklySummaryEnabled !== false,
    weeklyParentDigestEnabled: o.weeklyParentDigestEnabled !== false,
    weeklyParentDigestWeekday: Number.isFinite(weekday) && weekday >= 0 && weekday <= 6 ? weekday : 0,
    weeklyParentDigestLastSent: str(o.weeklyParentDigestLastSent) || undefined,
  };
}

export function parseStaffDirectoryFile(raw: unknown): StaffDirectoryRow[] {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rows = Array.isArray(o.rows) ? o.rows : [];
  return rows.map((r) => {
    const row = r && typeof r === "object" ? (r as Record<string, unknown>) : {};
    const email = str(row.email).trim();
    const branchId = str(row.branchId).trim();
    const role = str(row.role) === "executor" ? "executor" : "leader";
    if (!email || !isEmail(email) || !branchId) throw new Error("Ligne annuaire invalide (email, branche).");
    return { email, branchId, role, validUntil: str(row.validUntil) || undefined };
  });
}

export function parseTravelsModule(raw: unknown): TravelsModuleConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const providers = Array.isArray(o.transportProviders) ? o.transportProviders : [];
  return {
    comptaEmails: strArr(o.comptaEmails).filter(isEmail),
    transportProviders: providers.map((p) => {
      const x = p && typeof p === "object" ? (p as Record<string, unknown>) : {};
      const email = str(x.email).trim();
      if (!isEmail(email)) throw new Error("Transporteur : email invalide.");
      return { name: str(x.name) || "Transporteur", email };
    }),
  };
}

export function parseDomainPlanningModule(raw: unknown): DomainPlanningModuleConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const classesByPole: Record<string, string[]> = {};
  if (o.classesByPole && typeof o.classesByPole === "object") {
    for (const [k, v] of Object.entries(o.classesByPole as Record<string, unknown>)) {
      classesByPole[k] = strArr(v);
    }
  }
  const activityColors: Record<string, string> = {};
  if (o.activityColors && typeof o.activityColors === "object") {
    for (const [k, v] of Object.entries(o.activityColors as Record<string, unknown>)) {
      activityColors[k] = str(v);
    }
  }
  return {
    classesByPole,
    activityColors,
    hoursStart: typeof o.hoursStart === "number" ? o.hoursStart : 8,
    hoursEnd: typeof o.hoursEnd === "number" ? o.hoursEnd : 17,
    bookingHorizonDays: typeof o.bookingHorizonDays === "number" ? o.bookingHorizonDays : 56,
  };
}

export function parseProfRoomModule(raw: unknown): ProfRoomModuleConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const classesByPole: Record<string, string[]> = {};
  if (o.classesByPole && typeof o.classesByPole === "object") {
    for (const [k, v] of Object.entries(o.classesByPole as Record<string, unknown>)) {
      classesByPole[k] = strArr(v);
    }
  }
  const subjectColors: Record<string, string> = {};
  if (o.subjectColors && typeof o.subjectColors === "object") {
    for (const [k, v] of Object.entries(o.subjectColors as Record<string, unknown>)) {
      subjectColors[k] = str(v);
    }
  }
  return {
    classesByPole,
    subjectColors,
    hoursStart: typeof o.hoursStart === "number" ? o.hoursStart : 8,
    hoursEnd: typeof o.hoursEnd === "number" ? o.hoursEnd : 17,
    bookingHorizonDays: typeof o.bookingHorizonDays === "number" ? o.bookingHorizonDays : 56,
    adminClerkUserIds: strArr(o.adminClerkUserIds),
  };
}

export function parseRequestsRouting(raw: unknown): RequestsRoutingConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const services = Array.isArray(o.services) ? o.services : [];
  const tasks = Array.isArray(o.tasks) ? o.tasks : [];
  const assignments = Array.isArray(o.assignments) ? o.assignments : [];
  const directionQueues = Array.isArray(o.directionQueues) ? o.directionQueues : [];

  const parsedServices: RoutingService[] = services.map((s) => {
    const x = s && typeof s === "object" ? (s as Record<string, unknown>) : {};
    const id = str(x.id).trim();
    if (!id) throw new Error("Service : id requis.");
    return {
      id,
      label: str(x.label) || id,
      category: str(x.category) || "Général",
      manualOnly: x.manualOnly === true,
    };
  });

  const parsedTasks: RoutingTask[] = tasks.map((t) => {
    const x = t && typeof t === "object" ? (t as Record<string, unknown>) : {};
    const id = str(x.id).trim();
    if (!id) throw new Error("Tâche : id requis.");
    return {
      id,
      label: str(x.label) || id,
      hint: str(x.hint),
      keywords: strArr(x.keywords),
      active: x.active !== false,
    };
  });

  const parsedAssignments: RoutingAssignment[] = assignments.map((a) => {
    const x = a && typeof a === "object" ? (a as Record<string, unknown>) : {};
    const id = str(x.id).trim();
    const email = str(x.email).trim();
    if (!id) throw new Error("Affectation : id requis.");
    if (!email || !isEmail(email)) throw new Error("Affectation : email invalide.");
    return {
      id,
      taskId: str(x.taskId).trim(),
      email,
      personName: str(x.personName) || email.split("@")[0] || email,
      serviceId: str(x.serviceId).trim() || "administratif",
      active: x.active !== false,
    };
  });

  const parsedDirection: RoutingDirectionQueue[] = directionQueues.map((d) => {
    const x = d && typeof d === "object" ? (d as Record<string, unknown>) : {};
    const id = str(x.id).trim();
    const email = str(x.email).trim();
    if (!id) throw new Error("File direction : id requis.");
    if (!email || !isEmail(email)) throw new Error("File direction : email invalide.");
    return {
      id,
      label: str(x.label) || id,
      email,
      active: x.active !== false,
    };
  });

  return {
    version: 1,
    services: parsedServices,
    tasks: parsedTasks,
    assignments: parsedAssignments,
    directionQueues: parsedDirection,
  };
}

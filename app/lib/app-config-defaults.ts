import { SCHOOL } from "@/app/lib/school";
import { STAFF_DIRECTORY } from "@/app/lib/staff-directory";
import { TRANSPORT_PROVIDERS } from "@/app/lib/transport-providers";
import type {
  Establishment,
  NotificationsConfig,
  ProfRoomModuleConfig,
  SiteIdentity,
  StaffDirectoryRow,
  TravelsModuleConfig,
} from "@/app/lib/app-config-schemas";
import { DEFAULT_PROF_ROOM_SUBJECT_COLORS } from "@/app/lib/prof-room-defaults";

export function defaultSiteIdentity(): SiteIdentity {
  return {
    name: SCHOOL.name,
    shortName: SCHOOL.shortName,
    address: { ...SCHOOL.address },
    phone: { ...SCHOOL.phone },
    preinscriptionUrl: SCHOOL.preinscriptionUrl,
    reglementFinancier: SCHOOL.reglementFinancier,
  };
}

export function defaultEstablishments(): Establishment[] {
  return [
    {
      id: "ecole",
      label: SCHOOL.ecole.label,
      directorName: SCHOOL.ecole.directrice,
      directorEmail: SCHOOL.ecole.email,
      grades: SCHOOL.ecole.grades,
      clerkRoleSlugs: ["direction_ecole", "direction école"],
      active: true,
    },
    {
      id: "college",
      label: SCHOOL.college.label,
      directorName: SCHOOL.college.directrice,
      directorEmail: SCHOOL.college.email,
      grades: SCHOOL.college.grades,
      clerkRoleSlugs: ["direction_college", "direction collège"],
      active: true,
    },
    {
      id: "lycee",
      label: SCHOOL.lycee.label,
      directorName: SCHOOL.lycee.directrice,
      directorEmail: SCHOOL.lycee.email,
      grades: SCHOOL.lycee.grades,
      clerkRoleSlugs: ["direction_lycee", "direction_lycee"],
      active: true,
    },
  ];
}

export function defaultNotifications(): NotificationsConfig {
  return {
    travelsCompta: ["valerie.vasseur@laprovidence-nicolasbarre.fr", "cecile.douaglin@laprovidence-nicolasbarre.fr"],
    travelsCuisine: "chef.0056isi@newrest.eu",
    travelsZeendoc: "comptabilite@laprovidence-nicolasbarre.fr",
    hseOps: "sarah.buno@ac-normandie.fr",
    photocopiesOps: "carine.perier@ac-normandie.fr",
    absencesNotifyProfEcole: {
      label: SCHOOL.absences.notifyProfEcole.label,
      email: SCHOOL.absences.notifyProfEcole.email,
    },
    absencesNotifyProfCollegeLycee: {
      label: SCHOOL.absences.notifyProfCollegeLycee.label,
      email: SCHOOL.absences.notifyProfCollegeLycee.email,
    },
    absencesNotifyOgecCompta: [...SCHOOL.absences.notifyOgecCompta],
  };
}

export function defaultStaffDirectory(): StaffDirectoryRow[] {
  return STAFF_DIRECTORY.map((r) => ({
    email: r.email,
    branchId: r.branchId,
    role: r.role,
    validUntil: r.validUntil,
  }));
}

export function defaultTravelsModule(): TravelsModuleConfig {
  return {
    comptaEmails: ["valerie.vasseur@laprovidence-nicolasbarre.fr", "cecile.douaglin@laprovidence-nicolasbarre.fr"],
    transportProviders: TRANSPORT_PROVIDERS.map((p) => ({ ...p })),
  };
}

export function defaultProfRoomModule(): ProfRoomModuleConfig {
  return {
    classesByPole: {
      ÉCOLE: ["CP", "CE1", "CE2", "CM1", "CM2"],
      COLLÈGE: [
        "6A", "6B", "6C", "6D", "6E", "6F",
        "5A", "5B", "5C", "5D", "5E", "5F",
        "4A", "4B", "4C", "4D", "4E", "4F",
        "3A", "3B", "3C", "3D", "3E", "3F",
      ],
      LYCÉE: ["2A", "2B", "2C", "2D", "2E", "1A", "1B", "1C", "1D", "1E", "1F", "TA", "TB", "TC", "TD", "TE", "TF"],
      MAINTENANCE: ["MAINTENANCE"],
    },
    subjectColors: { ...DEFAULT_PROF_ROOM_SUBJECT_COLORS },
    hoursStart: 8,
    hoursEnd: 17,
    bookingHorizonDays: 56,
    adminLastNames: ["HACQUEVILLE-MATHI", "FORTINEAU", "DONA", "DUMOUCHEL", "PLANTEC", "GUEDIN", "LAINE", "LAQUIEVRE"],
    adminClerkUserIds: [],
  };
}

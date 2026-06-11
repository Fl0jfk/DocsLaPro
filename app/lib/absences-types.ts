import type { AbsenceHoursTreatment } from "@/app/lib/absence-hours-treatment";
import type { AbsencePeriodType } from "@/app/lib/absence-period";

export type AbsenceScope = "professeur" | "ogec";
export type Etablissement = "École" | "Collège" | "Lycée";
export type AbsenceWorkflowStatus = "OUVERTE" | "JUSTIFICATIF_DEPOSE" | "CLOTUREE";
export type AbsenceDecision = "EN_ATTENTE" | "VALIDEE" | "REFUSEE";
export type AbsenceSource = "self" | "admin_manual" | "admin_pdf";

export type AbsenceRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: AbsenceSource;
  displayName: string;
  calendarVisible: boolean;
  createdBy: {
    userId: string;
    name: string;
    email: string;
    roles: string[];
  };
  data: {
    scope: AbsenceScope;
    etablissement: Etablissement | null;
    periodType?: AbsencePeriodType | null;
    startDate: string;
    endDate: string;
    startTime?: string | null;
    endTime?: string | null;
    startAt: string;
    endAt: string;
    reason: string;
    details: string;
    sourceDocument?: string;
    documentKeys?: string[];
    confidence?: number;
  };
  workflowStatus: AbsenceWorkflowStatus;
  managerDecision: AbsenceDecision;
  closedAt?: string | null;
  justification?: {
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null;
  managerNote?: string;
  hoursTreatment?: AbsenceHoursTreatment | null;
  justificatifRelanceAt?: string | null;
  history: Array<{
    at: string;
    by: string;
    action: string;
    note?: string;
  }>;
};

export const ABSENCES_INDEX_KEY = "absences/index.json";

export function normRole(s: string) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, "");
}

export function normRoleSpaced(s: string) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, " ")
    .trim();
}

export function hasRole(roles: string[], matcher: string) {
  const m = normRole(matcher);
  return roles.some((r) => normRole(r).includes(m));
}

export function isTeacherRole(roles: string[]) {
  return roles.some((r) => normRole(r).includes("professeur"));
}

export function getRoleFlags(roles: string[]) {
  return {
    isDirectionEcole: hasRole(roles, "directionecole"),
    isDirectionCollege: hasRole(roles, "directioncollege"),
    isDirectionLycee: hasRole(roles, "directionlycee"),
    isCompta: hasRole(roles, "comptabilite"),
    isAdministratif: hasRole(roles, "administratif"),
    isEducation: hasRole(roles, "education"),
  };
}

export function canViewCalendar(roles: string[]) {
  if (isTeacherRole(roles) && !getRoleFlags(roles).isAdministratif) return false;
  const flags = getRoleFlags(roles);
  if (flags.isCompta) return true;
  const normalized = roles.map((r) => normRoleSpaced(r));
  return normalized.some((r) =>
    ["administratif", "direction ecole", "direction college", "direction lycee", "education"].some((allowed) =>
      r.includes(allowed),
    ),
  );
}

export function canAdminIngest(roles: string[]) {
  return canViewCalendar(roles);
}

export function canViewAbsence(abs: AbsenceRecord, viewerUserId: string, roles: string[]) {
  if (abs.createdBy.userId === viewerUserId) return true;
  const flags = getRoleFlags(roles);
  if (abs.data.scope === "ogec") {
    return flags.isDirectionLycee;
  }
  if (flags.isAdministratif || flags.isEducation) return true;
  if (abs.data.etablissement === "École") return flags.isDirectionEcole;
  if (abs.data.etablissement === "Collège") return flags.isDirectionCollege;
  if (abs.data.etablissement === "Lycée") return flags.isDirectionLycee;
  return false;
}

export function canManageAbsence(abs: AbsenceRecord, roles: string[]) {
  const flags = getRoleFlags(roles);
  if (abs.data.scope === "ogec") return flags.isDirectionLycee;
  if (abs.data.etablissement === "École") return flags.isDirectionEcole;
  if (abs.data.etablissement === "Collège") return flags.isDirectionCollege;
  if (abs.data.etablissement === "Lycée") return flags.isDirectionLycee;
  return false;
}

/** File « À traiter » : décision en attente, hors saisie admin, pas sa propre déclaration. */
export function isAbsencePendingForManager(
  abs: AbsenceRecord,
  viewerUserId: string,
  roles: string[],
): boolean {
  if (abs.createdBy.userId === viewerUserId) return false;
  if (abs.managerDecision !== "EN_ATTENTE" || abs.workflowStatus === "CLOTUREE") return false;
  if (abs.source === "admin_manual" || abs.source === "admin_pdf") return false;
  return canManageAbsence(abs, roles);
}

export function parseLocalDateTime(dateStr: string, timeStr: string): Date | null {
  const ds = String(dateStr || "").trim();
  const ts = String(timeStr || "").trim();
  if (!ds || !ts) return null;
  const timeNorm = ts.length === 5 ? `${ts}:00` : ts;
  const [y, mo, d] = ds.split("-").map((v) => Number(v));
  const tp = timeNorm.split(":");
  const h = Number(tp[0]);
  const mi = Number(tp[1] ?? 0);
  const sec = Number(tp[2] ?? 0);
  if (![y, mo, d, h, mi, sec].every((n) => Number.isFinite(n))) return null;
  const dt = new Date(y, mo - 1, d, h, mi, sec, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function computeStartEndAt(input: {
  periodType?: AbsencePeriodType | null;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
}): { startAt: string; endAt: string } {
  if (input.periodType === "single_day" && input.startTime && input.endTime) {
    const start = parseLocalDateTime(input.startDate, input.startTime);
    const end = parseLocalDateTime(input.endDate, input.endTime);
    if (start && end) return { startAt: start.toISOString(), endAt: end.toISOString() };
  }
  const start = parseLocalDateTime(input.startDate, "08:00");
  const end = parseLocalDateTime(input.endDate, "18:00");
  return {
    startAt: (start || new Date(`${input.startDate}T08:00:00`)).toISOString(),
    endAt: (end || new Date(`${input.endDate}T18:00:00`)).toISOString(),
  };
}

/** Normalise un enregistrement (legacy self ou anciennes convocations migrées). */
export function normalizeAbsenceRecord(raw: AbsenceRecord): AbsenceRecord {
  const data = raw.data ?? {
    scope: "professeur" as const,
    etablissement: null,
    startDate: "",
    endDate: "",
    startAt: "",
    endAt: "",
    reason: "",
    details: "",
  };

  const source: AbsenceSource =
    raw.source === "admin_manual" || raw.source === "admin_pdf" || raw.source === "self"
      ? raw.source
      : raw.managerDecision === "VALIDEE" && raw.workflowStatus === "CLOTUREE" && !raw.createdBy?.userId
        ? "admin_pdf"
        : "self";

  const displayName =
    raw.displayName?.trim() ||
    (data as { teacherName?: string }).teacherName?.trim() ||
    raw.createdBy?.name ||
    "Inconnu";

  const reason =
    data.reason?.trim() ||
    (data as { examType?: string }).examType?.trim() ||
    "Absence";

  const { startAt, endAt } =
    data.startAt && data.endAt
      ? { startAt: data.startAt, endAt: data.endAt }
      : computeStartEndAt({
          periodType: data.periodType,
          startDate: data.startDate,
          endDate: data.endDate,
          startTime: data.startTime,
          endTime: data.endTime,
        });

  const calendarVisible =
    typeof raw.calendarVisible === "boolean"
      ? raw.calendarVisible
      : source === "admin_manual" || source === "admin_pdf"
        ? true
        : raw.managerDecision === "VALIDEE";

  return {
    ...raw,
    source,
    displayName,
    calendarVisible,
    data: {
      ...data,
      reason,
      details: data.details ?? "",
      startAt,
      endAt,
      documentKeys: data.documentKeys,
    },
  };
}

export function buildAdminAbsenceRecord(params: {
  source: "admin_manual" | "admin_pdf";
  displayName: string;
  etablissement: Etablissement;
  reason: string;
  startAt: string;
  endAt: string;
  documentKeys?: string[];
  sourceDocument?: string;
  confidence?: number;
  createdBy: AbsenceRecord["createdBy"];
}): AbsenceRecord {
  const now = new Date().toISOString();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const documentKeys = params.documentKeys?.filter(Boolean) ?? [];
  return {
    id,
    createdAt: now,
    updatedAt: now,
    source: params.source,
    displayName: params.displayName,
    calendarVisible: true,
    createdBy: params.createdBy,
    data: {
      scope: "professeur",
      etablissement: params.etablissement,
      periodType: params.startAt.slice(0, 10) === params.endAt.slice(0, 10) ? "single_day" : "multi_day",
      startDate: params.startAt.slice(0, 10),
      endDate: params.endAt.slice(0, 10),
      startTime: null,
      endTime: null,
      startAt: params.startAt,
      endAt: params.endAt,
      reason: params.reason,
      details: "",
      sourceDocument: params.sourceDocument,
      documentKeys,
      confidence: params.confidence ?? 1,
    },
    workflowStatus: "CLOTUREE",
    managerDecision: "VALIDEE",
    closedAt: now,
    justification: null,
    justificatifRelanceAt: null,
    history: [
      {
        at: now,
        by: params.createdBy.name,
        action: params.source === "admin_pdf" ? "IMPORT_PDF" : "SAISIE_MANUELLE",
      },
    ],
  };
}

export function normalizeEtablissement(value: string): Etablissement {
  const n = normRoleSpaced(value);
  if (n.includes("ecole")) return "École";
  if (n.includes("lycee")) return "Lycée";
  return "Collège";
}

import type { DashboardCategory } from "@/app/lib/intranet-modules";
import type { AcademicDeadline } from "@/app/lib/academic-deadlines";

export const DASHBOARD_ACADEMIC_DEADLINES_MODULE_ID = "dashboard-academic-deadlines";

export const ACADEMIC_DEADLINES_STORAGE_PATH = "dashboard/academic-deadlines/custom.json";

export type StoredAcademicDeadlinesData = {
  items: AcademicDeadline[];
  updatedAt?: string;
};

export const ACADEMIC_DEADLINES_DASHBOARD_CATEGORY: DashboardCategory = {
  id: 9002,
  moduleId: DASHBOARD_ACADEMIC_DEADLINES_MODULE_ID,
  name: "Échéances académiques",
  link: "#",
  img: "",
  description: "Mutations, examens, Parcoursup, affectations — Académie de Normandie",
  allowedRoles: [],
  variant: "academic-deadlines",
};

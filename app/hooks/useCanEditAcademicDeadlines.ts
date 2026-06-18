"use client";

import { useUser } from "@clerk/nextjs";
import { canEditAcademicDeadlinesFromRoles } from "@/app/lib/academic-deadlines-access";
import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";

export function useCanEditAcademicDeadlines(): boolean {
  const { user } = useUser();
  const roles = intranetRolesFromMetadata(user?.publicMetadata);
  return canEditAcademicDeadlinesFromRoles(roles);
}

"use client";

import { useUser, useOrganization } from "@clerk/nextjs";

export function useIsTenantOrgAdmin(): boolean {
  const { user } = useUser();
  const meta = user?.publicMetadata as Record<string, unknown> | undefined;
  const roles = meta?.role;
  const arr = Array.isArray(roles) ? roles.map(String) : roles ? [String(roles)] : [];
  if (arr.includes("admin")) return true;
  if (meta?.org_admin === true) return true;
  if (meta?.platform_admin === true) return true;
  return arr.includes("platform_admin");
}

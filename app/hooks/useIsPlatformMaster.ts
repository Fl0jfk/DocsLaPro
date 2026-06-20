"use client";

import { useUser } from "@clerk/nextjs";

export function useIsPlatformMaster(): boolean {
  const { user } = useUser();
  const meta = user?.publicMetadata as Record<string, unknown> | undefined;
  const roles = meta?.role;
  const arr = Array.isArray(roles) ? roles.map(String) : roles ? [String(roles)] : [];
  return arr.includes("master");
}

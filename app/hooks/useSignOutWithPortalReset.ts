"use client";

import { useClerk } from "@clerk/nextjs";
import { useCallback } from "react";
import { clearLastPortalTenant } from "@/app/lib/tenant-portal-client";

function signOutRedirectUrl(): string {
  if (typeof window === "undefined") return "/";
  try {
    return `${window.location.origin}/`;
  } catch {
    return "/";
  }
}

/** Déconnexion Clerk + oubli du dernier établissement mémorisé sur cet appareil. */
export function useSignOutWithPortalReset() {
  const { signOut } = useClerk();

  return useCallback(
    (redirectUrl?: string) => {
      clearLastPortalTenant();
      void signOut({ redirectUrl: redirectUrl ?? signOutRedirectUrl() });
    },
    [signOut],
  );
}

"use client";

import { useClerk } from "@clerk/nextjs";
import { useCallback } from "react";
import { clearLastPortalTenant } from "@/app/lib/tenant-portal-client";

/** Déconnexion Clerk + oubli du dernier établissement mémorisé sur cet appareil. */
export function useSignOutWithPortalReset() {
  const { signOut } = useClerk();

  return useCallback(
    (redirectUrl = "/") => {
      clearLastPortalTenant();
      void signOut({ redirectUrl });
    },
    [signOut],
  );
}

"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { clearLastPortalTenant } from "@/app/lib/tenant-portal-client";

/** Oublie le dernier établissement quand la session Clerk se termine (ex. UserButton). */
export default function PortalMemoryOnSignOut() {
  const { isLoaded, isSignedIn } = useUser();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (wasSignedIn.current && !isSignedIn) {
      clearLastPortalTenant();
    }
    wasSignedIn.current = isSignedIn;
  }, [isLoaded, isSignedIn]);

  return null;
}

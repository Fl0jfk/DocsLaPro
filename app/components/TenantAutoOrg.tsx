"use client";

import { useEffect } from "react";
import { useAuth, useOrganization, useOrganizationList } from "@clerk/nextjs";

/** Active automatiquement la seule organisation de l'utilisateur (sans switcher visible). */
export default function TenantAutoOrg() {
  const { isLoaded: authLoaded } = useAuth();
  const { organization } = useOrganization();
  const { isLoaded, setActive, userMemberships } = useOrganizationList({
    userMemberships: true,
  });

  useEffect(() => {
    if (!authLoaded || !isLoaded || organization) return;
    const first = userMemberships.data?.[0]?.organization;
    if (first?.id) {
      void setActive({ organization: first.id });
    }
  }, [authLoaded, isLoaded, organization, userMemberships.data, setActive]);

  return null;
}

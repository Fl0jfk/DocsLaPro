"use client";

import { createContext, useContext } from "react";

export type PublicSiteIdentity = {
  name?: string;
  shortName?: string;
  headerLogoUrl: string | null;
};

const PublicSiteIdentityContext = createContext<PublicSiteIdentity | null>(null);

export function PublicSiteIdentityProvider({
  identity,
  children,
}: {
  identity: PublicSiteIdentity;
  children: React.ReactNode;
}) {
  return (
    <PublicSiteIdentityContext.Provider value={identity}>{children}</PublicSiteIdentityContext.Provider>
  );
}

export function usePublicSiteIdentity(): PublicSiteIdentity | null {
  return useContext(PublicSiteIdentityContext);
}

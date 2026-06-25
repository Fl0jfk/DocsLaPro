import { PublicSiteIdentityProvider } from "@/app/contexts/public-site-identity";
import { loadPublicSiteIdentity } from "@/app/lib/site-public";

/** Charge l'identité publique (logo tenant) côté serveur pour éviter le flash logo plateforme → établissement. */
export default async function PublicSiteIdentityLayout({ children }: { children: React.ReactNode }) {
  const identity = await loadPublicSiteIdentity();
  return <PublicSiteIdentityProvider identity={identity}>{children}</PublicSiteIdentityProvider>;
}

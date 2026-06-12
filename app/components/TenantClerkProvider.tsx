import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { clerkKeysFromEnvOverride } from "@/app/lib/clerk-tenant-keys";
import { getTenant } from "@/app/lib/tenant-context";
import { isMultiTenantEnabled } from "@/app/lib/tenant-registry";

type Props = {
  children: React.ReactNode;
};

/** ClerkProvider — clé dynamique par tenant uniquement si registry multi-tenant actif. */
export default async function TenantClerkProvider({ children }: Props) {
  if (!isMultiTenantEnabled()) {
    return <ClerkProvider localization={frFR}>{children}</ClerkProvider>;
  }

  const envClerk = clerkKeysFromEnvOverride();
  const publishableKey = envClerk?.publishableKey ?? (await getTenant()).clerkPublishableKey;
  return (
    <ClerkProvider publishableKey={publishableKey} localization={frFR}>
      {children}
    </ClerkProvider>
  );
}

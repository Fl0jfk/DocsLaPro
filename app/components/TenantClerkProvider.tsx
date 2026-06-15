import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { headers } from "next/headers";
import LocalClerkSetupBanner from "@/app/components/LocalClerkSetupBanner";
import {
  clerkKeysFromEnv,
  needsLocalClerkDevKeys,
  resolveClerkKeysForHostname,
} from "@/app/lib/clerk-tenant-keys";
import { getTenant } from "@/app/lib/tenant-context";
import { isMultiTenantEnabled } from "@/app/lib/tenant-registry";

type Props = {
  children: React.ReactNode;
};

async function requestHostname(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
}

/** ClerkProvider — clé dynamique par tenant uniquement si registry multi-tenant actif. */
export default async function TenantClerkProvider({ children }: Props) {
  const host = await requestHostname();

  if (!isMultiTenantEnabled()) {
    const env = clerkKeysFromEnv();
    const publishableKey =
      env?.publishableKey ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";

    if (needsLocalClerkDevKeys(host, publishableKey)) {
      return (
        <>
          <LocalClerkSetupBanner />
          {children}
        </>
      );
    }

    return (
      <ClerkProvider publishableKey={publishableKey || undefined} localization={frFR}>
        {children}
      </ClerkProvider>
    );
  }

  const tenant = await getTenant();
  const keys = resolveClerkKeysForHostname(host, {
    clerkPublishableKey: tenant.clerkPublishableKey,
    clerkSecretKey: tenant.clerkSecretKey,
    clerkDevPublishableKey: tenant.secrets?.clerkDevPublishableKey,
    clerkDevSecretKey: tenant.secrets?.clerkDevSecretKey,
  });

  if (needsLocalClerkDevKeys(host, keys.publishableKey)) {
    return (
      <>
        <LocalClerkSetupBanner />
        {children}
      </>
    );
  }

  return (
    <ClerkProvider publishableKey={keys.publishableKey} localization={frFR}>
      {children}
    </ClerkProvider>
  );
}

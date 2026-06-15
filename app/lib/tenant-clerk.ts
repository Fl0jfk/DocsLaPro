import "server-only";
import { createClerkClient } from "@clerk/backend";
import type { ClerkClient } from "@clerk/backend";
import { clerkClient } from "@clerk/nextjs/server";
import { clerkKeysFromEnv } from "@/app/lib/clerk-tenant-keys";
import { getTenant } from "@/app/lib/tenant-context";
import { isMultiTenantEnabled } from "@/app/lib/tenant-registry";

export async function getClerkClientForTenant(): Promise<ClerkClient> {
  if (!isMultiTenantEnabled()) {
    return clerkClient();
  }
  const envClerk = clerkKeysFromEnv();
  if (envClerk) {
    return createClerkClient({ secretKey: envClerk.secretKey });
  }
  const tenant = await getTenant();
  return createClerkClient({ secretKey: tenant.clerkSecretKey });
}

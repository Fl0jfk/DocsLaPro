import "server-only";
import { createClerkClient } from "@clerk/backend";
import type { ClerkClient } from "@clerk/backend";
import { clerkClient } from "@clerk/nextjs/server";
import { getTenant } from "@/app/lib/tenant-context";
import { isMultiTenantEnabled } from "@/app/lib/tenant-registry";

export async function getClerkClientForTenant(): Promise<ClerkClient> {
  if (!isMultiTenantEnabled()) {
    return clerkClient();
  }
  const tenant = await getTenant();
  return createClerkClient({ secretKey: tenant.clerkSecretKey });
}

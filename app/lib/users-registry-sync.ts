import { clerkClient } from "@clerk/nextjs/server";
import type { RegistryUser } from "@/app/lib/users-registry";

/** Aligne Clerk (UI + middleware) sur le registre S3. */
export async function syncRegistryUserToClerk(orgId: string, entry: RegistryUser): Promise<void> {
  const client = await clerkClient();
  const user = await client.users.getUser(entry.clerkUserId);
  await client.users.updateUser(entry.clerkUserId, {
    publicMetadata: {
      ...(user.publicMetadata as object),
      tenantOrgId: orgId,
      role: entry.roles,
      org_admin: entry.roles.includes("admin"),
    },
  });
}

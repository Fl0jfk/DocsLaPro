import { clerkClient } from "@clerk/nextjs/server";
import { displayNameForUser, readUsersRegistry, writeUsersRegistry, type RegistryUser } from "@/app/lib/users-registry";

export type EnrichedRegistryUser = RegistryUser & { displayName: string };

export async function enrichOrgUsersFromClerk(
  orgId: string,
  users: RegistryUser[],
  persist = true,
): Promise<EnrichedRegistryUser[]> {
  const client = await clerkClient();
  const registry = persist ? await readUsersRegistry() : null;
  let dirty = false;
  const out: EnrichedRegistryUser[] = [];

  for (const u of users) {
    let firstName = u.firstName?.trim() ?? "";
    let lastName = u.lastName?.trim() ?? "";
    if (u.clerkUserId && (!firstName || !lastName)) {
      try {
        const clerk = await client.users.getUser(u.clerkUserId);
        const fn = clerk.firstName?.trim() ?? "";
        const ln = clerk.lastName?.trim() ?? "";
        if (fn && !firstName) firstName = fn;
        if (ln && !lastName) lastName = ln;
        if (persist && registry && (fn || ln)) {
          const idx = registry.organizations[orgId]?.users.findIndex(
            (x) => x.clerkUserId === u.clerkUserId || x.email === u.email,
          );
          if (idx !== undefined && idx >= 0) {
            if (fn) registry.organizations[orgId].users[idx].firstName = fn;
            if (ln) registry.organizations[orgId].users[idx].lastName = ln;
            registry.organizations[orgId].users[idx].updatedAt = new Date().toISOString();
            dirty = true;
          }
        }
      } catch {
        /* ignore */
      }
    }
    const merged = { ...u, firstName: firstName || u.firstName, lastName: lastName || u.lastName };
    out.push({ ...merged, displayName: displayNameForUser(merged) });
  }

  if (dirty && registry) await writeUsersRegistry(registry);
  return out;
}

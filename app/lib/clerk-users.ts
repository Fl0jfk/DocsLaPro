import { getClerkClientForTenant } from "@/app/lib/tenant-clerk";
import type { User } from "@clerk/backend";
import { hasGlobalAdminRole, intranetRolesFromMetadata, normalizeIntranetRoles } from "@/app/lib/intranet-roles";

export type ClerkMemberRow = {
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  roles: string[];
  pending: boolean;
  createdAt: string;
  updatedAt: string;
};

function primaryEmail(u: User): string {
  return u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? "";
}

function displayName(u: { firstName?: string | null; lastName?: string | null; email: string }): string {
  const n = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return n || u.email;
}

export function memberRowFromClerkUser(u: User): ClerkMemberRow {
  const roles = intranetRolesFromMetadata(u.publicMetadata);
  return {
    clerkUserId: u.id,
    email: primaryEmail(u),
    firstName: u.firstName ?? undefined,
    lastName: u.lastName ?? undefined,
    displayName: displayName({ firstName: u.firstName, lastName: u.lastName, email: primaryEmail(u) }),
    roles,
    pending: false,
    createdAt: new Date(u.createdAt).toISOString(),
    updatedAt: new Date(u.updatedAt).toISOString(),
  };
}

export async function listClerkMembers(): Promise<ClerkMemberRow[]> {
  const client = await getClerkClientForTenant();
  const out: ClerkMemberRow[] = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const page = await client.users.getUserList({ limit, offset });
    for (const u of page.data) {
      out.push(memberRowFromClerkUser(u));
    }
    if (page.data.length < limit) break;
    offset += limit;
  }

  const invites = await client.invitations.getInvitationList({ status: "pending" });
  for (const inv of invites.data) {
    const email = inv.emailAddress;
    if (!email || out.some((m) => m.email.toLowerCase() === email.toLowerCase())) continue;
    const roles = normalizeIntranetRoles((inv.publicMetadata as Record<string, unknown> | undefined)?.role);
    out.push({
      clerkUserId: "",
      email,
      roles,
      pending: true,
      createdAt: new Date(inv.createdAt).toISOString(),
      updatedAt: new Date(inv.createdAt).toISOString(),
      displayName: email,
    });
  }

  return out.sort((a, b) => displayName(a).localeCompare(displayName(b), "fr", { sensitivity: "base" }));
}

export async function syncClerkUserRoles(
  clerkUserId: string,
  roles: string[],
): Promise<void> {
  const client = await getClerkClientForTenant();
  const user = await client.users.getUser(clerkUserId);
  await client.users.updateUser(clerkUserId, {
    publicMetadata: {
      ...(user.publicMetadata as object),
      role: roles,
      org_admin: hasGlobalAdminRole(roles),
    },
  });
}

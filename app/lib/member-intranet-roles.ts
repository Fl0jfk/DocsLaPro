import { clerkClient } from "@clerk/nextjs/server";
import { intranetRolesFromMetadata, normalizeIntranetRoles } from "@/app/lib/intranet-roles";
import { getTenantJson, putTenantJson } from "@/app/lib/tenant-s3-storage";

const PENDING_KEY = "settings/pending-intranet-roles.json";

type PendingEntry = { email: string; roles: string[]; orgAdmin?: boolean; createdAt: string };
type PendingFile = { invites: PendingEntry[] };

export async function loadPendingRoles(orgId: string): Promise<PendingEntry[]> {
  const hit = await getTenantJson<PendingFile>(orgId, PENDING_KEY);
  return hit?.data?.invites ?? [];
}

export async function savePendingRoles(orgId: string, invites: PendingEntry[]): Promise<void> {
  await putTenantJson(orgId, PENDING_KEY, { invites });
}

export async function queuePendingRoles(
  orgId: string,
  email: string,
  roles: string[],
  orgAdmin = false,
): Promise<void> {
  const normalized = normalizeIntranetRoles(roles);
  if (normalized.length === 0) return;
  const emailNorm = email.trim().toLowerCase();
  const list = await loadPendingRoles(orgId);
  const filtered = list.filter((e) => e.email !== emailNorm);
  filtered.push({ email: emailNorm, roles: normalized, orgAdmin, createdAt: new Date().toISOString() });
  await savePendingRoles(orgId, filtered);
}

export async function applyUserTenantMetadata(
  userId: string,
  orgId: string,
  roles: string[],
  orgAdmin: boolean,
): Promise<void> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = { ...(user.publicMetadata as object) };
  await client.users.updateUser(userId, {
    publicMetadata: {
      ...meta,
      tenantOrgId: orgId,
      role: normalizeIntranetRoles(roles),
      org_admin: orgAdmin,
    },
  });
}

/** Applique les rôles en attente dès que le compte Clerk existe (sans membership org). */
export async function applyPendingIntranetRoles(orgId: string): Promise<number> {
  const pending = await loadPendingRoles(orgId);
  if (pending.length === 0) return 0;

  const client = await clerkClient();
  const remaining: PendingEntry[] = [];
  let applied = 0;

  for (const entry of pending) {
    try {
      const found = await client.users.getUserList({ emailAddress: [entry.email], limit: 1 });
      const user = found.data?.[0];
      if (!user) {
        remaining.push(entry);
        continue;
      }
      await applyUserTenantMetadata(user.id, orgId, entry.roles, entry.orgAdmin === true);
      applied++;
    } catch {
      remaining.push(entry);
    }
  }

  await savePendingRoles(orgId, remaining);
  return applied;
}

export async function setUserIntranetRoles(
  userId: string,
  orgId: string,
  roles: unknown,
  orgAdmin?: boolean,
): Promise<string[]> {
  const normalized = normalizeIntranetRoles(roles);
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = { ...(user.publicMetadata as object) } as Record<string, unknown>;
  if (orgAdmin === true) meta.org_admin = true;
  if (orgAdmin === false) meta.org_admin = false;
  await client.users.updateUser(userId, {
    publicMetadata: {
      ...meta,
      tenantOrgId: orgId,
      role: normalized,
    },
  });
  return normalized;
}

export async function listIntranetUsersForTenant(orgId: string) {
  const client = await clerkClient();
  const legacy = orgId;
  const out: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    orgRole: string;
    roles: string[];
    orgAdminMeta: boolean;
  }> = [];
  let offset = 0;
  const pageSize = 100;
  for (let page = 0; page < 10; page++) {
    const batch = await client.users.getUserList({ limit: pageSize, offset });
    for (const user of batch.data) {
      const meta = user.publicMetadata as Record<string, unknown>;
      const tid = typeof meta?.tenantOrgId === "string" ? meta.tenantOrgId : "";
      const roles = intranetRolesFromMetadata(meta);
      const belongs = tid === orgId || (!tid && roles.length > 0 && legacy);
      if (!belongs) continue;
      const email = user.emailAddresses[0]?.emailAddress ?? "";
      out.push({
        id: user.id,
        userId: user.id,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || email,
        email,
        orgRole: meta?.org_admin === true ? "org:admin" : "org:member",
        roles,
        orgAdminMeta: meta?.org_admin === true,
      });
    }
    if (batch.data.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getBucketName, getTenantS3Client } from "@/app/lib/tenant-s3-storage";
import { normalizeIntranetRoles } from "@/app/lib/intranet-roles";

/** Registre global à la racine du bucket (pas sous tenants/). */
export const USERS_REGISTRY_KEY = "users-registry.json";

export type RegistryUser = {
  /** Vide tant que l'invitation n'est pas acceptée. */
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  pending?: boolean;
  createdAt: string;
  updatedAt: string;
};

export function displayNameForUser(u: RegistryUser): string {
  const n = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return n || u.email;
}

export type RegistryOrg = {
  label?: string;
  users: RegistryUser[];
};

export type UsersRegistry = {
  version: number;
  updatedAt: string;
  organizations: Record<string, RegistryOrg>;
};

function emptyRegistry(): UsersRegistry {
  return { version: 1, updatedAt: new Date().toISOString(), organizations: {} };
}

export async function readUsersRegistry(): Promise<UsersRegistry> {
  const client = getTenantS3Client();
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: getBucketName(), Key: USERS_REGISTRY_KEY }),
    );
    const raw = await res.Body?.transformToString();
    if (!raw?.trim()) return emptyRegistry();
    const parsed = JSON.parse(raw) as UsersRegistry;
    if (!parsed.organizations || typeof parsed.organizations !== "object") return emptyRegistry();
    return parsed;
  } catch {
    return emptyRegistry();
  }
}

export async function writeUsersRegistry(data: UsersRegistry): Promise<void> {
  data.updatedAt = new Date().toISOString();
  await getTenantS3Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: USERS_REGISTRY_KEY,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    }),
  );
}

export function findUserInRegistry(
  registry: UsersRegistry,
  opts: { clerkUserId?: string; email?: string },
): { orgId: string; user: RegistryUser; index: number } | null {
  const emailNorm = opts.email?.trim().toLowerCase();
  for (const [orgId, org] of Object.entries(registry.organizations)) {
    const users = org.users ?? [];
    const index = users.findIndex((u) => {
      if (opts.clerkUserId && u.clerkUserId === opts.clerkUserId) return true;
      if (emailNorm && u.email.trim().toLowerCase() === emailNorm) return true;
      return false;
    });
    if (index >= 0) return { orgId, user: users[index], index };
  }
  return null;
}

export function listUsersForOrg(registry: UsersRegistry, orgId: string): RegistryUser[] {
  return [...(registry.organizations[orgId]?.users ?? [])];
}

export function ensureOrgBucket(registry: UsersRegistry, orgId: string, label?: string): void {
  if (!registry.organizations[orgId]) {
    registry.organizations[orgId] = { label, users: [] };
  } else if (label && !registry.organizations[orgId].label) {
    registry.organizations[orgId].label = label;
  }
}

export function hasGlobalAdminRole(roles: string[]): boolean {
  return normalizeIntranetRoles(roles).includes("admin");
}

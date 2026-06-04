import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { INTRANET_ROLE_OPTIONS, normalizeIntranetRoles } from "@/app/lib/intranet-roles";
import { requireRegistryAdmin } from "@/app/lib/registry-admin-auth";
import { syncRegistryUserToClerk } from "@/app/lib/users-registry-sync";
import { enrichOrgUsersFromClerk } from "@/app/lib/users-registry-enrich";
import {
  USERS_REGISTRY_KEY,
  ensureOrgBucket,
  findUserInRegistry,
  listUsersForOrg,
  readUsersRegistry,
  writeUsersRegistry,
  type RegistryUser,
} from "@/app/lib/users-registry";

async function resolvePendingUsers(orgId: string): Promise<void> {
  const registry = await readUsersRegistry();
  const users = registry.organizations[orgId]?.users ?? [];
  let changed = false;
  const client = await clerkClient();
  for (const u of users) {
    if (u.clerkUserId && !u.pending) continue;
    const found = await client.users.getUserList({ emailAddress: [u.email], limit: 1 });
    const clerk = found.data?.[0];
    if (!clerk) continue;
    u.clerkUserId = clerk.id;
    u.pending = false;
    u.firstName = clerk.firstName?.trim() || u.firstName;
    u.lastName = clerk.lastName?.trim() || u.lastName;
    u.updatedAt = new Date().toISOString();
    changed = true;
    await syncRegistryUserToClerk(orgId, u);
  }
  if (changed) await writeUsersRegistry(registry);
}

export async function GET() {
  const gate = await requireRegistryAdmin();
  if (!gate.ok) return gate.response;
  const { orgId } = gate.ctx;
  try {
    await resolvePendingUsers(orgId);
    const registry = await readUsersRegistry();
    const raw = listUsersForOrg(registry, orgId);
    const users = await enrichOrgUsersFromClerk(orgId, raw, true);
    return NextResponse.json({
      registryKey: USERS_REGISTRY_KEY,
      organizationId: orgId,
      users,
      roleOptions: INTRANET_ROLE_OPTIONS,
    });
  } catch (e) {
    console.error("members GET:", e);
    return NextResponse.json({ error: "Impossible de charger le registre." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const gate = await requireRegistryAdmin();
  if (!gate.ok) return gate.response;
  const { orgId, userId: inviterId } = gate.ctx;
  try {
    const body = await req.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const roles = normalizeIntranetRoles(body.intranetRoles ?? body.roles);
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
    }
    if (roles.length === 0) {
      return NextResponse.json({ error: "Sélectionnez au moins un rôle." }, { status: 400 });
    }

    const registry = await readUsersRegistry();
    if (findUserInRegistry(registry, { email })) {
      return NextResponse.json({ error: "Cet e-mail est déjà dans le registre." }, { status: 409 });
    }

    const client = await clerkClient();
    const existing = await client.users.getUserList({ emailAddress: [email], limit: 1 });
    const clerkUser = existing.data?.[0];
    const now = new Date().toISOString();

    let entry: RegistryUser;

    if (clerkUser) {
      entry = {
        clerkUserId: clerkUser.id,
        email,
        firstName: firstName || clerkUser.firstName?.trim() || undefined,
        lastName: lastName || clerkUser.lastName?.trim() || undefined,
        roles,
        pending: false,
        createdAt: now,
        updatedAt: now,
      };
      ensureOrgBucket(registry, orgId);
      registry.organizations[orgId].users.push(entry);
      await writeUsersRegistry(registry);
      await syncRegistryUserToClerk(orgId, entry);
      return NextResponse.json({
        success: true,
        mode: "registry_existing_clerk",
        user: entry,
        message: "Utilisateur ajouté au registre et synchronisé avec Clerk.",
      });
    }

    await client.invitations.createInvitation({
      emailAddress: email,
      inviterUserId: inviterId,
      publicMetadata: { tenantOrgId: orgId, role: roles },
    });

    entry = {
      clerkUserId: "",
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      roles,
      pending: true,
      createdAt: now,
      updatedAt: now,
    };
    ensureOrgBucket(registry, orgId);
    registry.organizations[orgId].users.push(entry);
    await writeUsersRegistry(registry);

    return NextResponse.json({
      success: true,
      mode: "registry_invitation",
      user: entry,
      message: "Ajouté au registre JSON + invitation Clerk envoyée.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Création impossible";
    console.error("members POST:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const gate = await requireRegistryAdmin();
  if (!gate.ok) return gate.response;
  const { orgId } = gate.ctx;
  try {
    const body = await req.json();
    const clerkUserId = String(body.clerkUserId ?? body.userId ?? "").trim();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const roles = normalizeIntranetRoles(body.intranetRoles ?? body.roles);
    if (roles.length === 0) {
      return NextResponse.json({ error: "Sélectionnez au moins un rôle." }, { status: 400 });
    }

    const registry = await readUsersRegistry();
    const hit = findUserInRegistry(registry, {
      clerkUserId: clerkUserId || undefined,
      email: email || undefined,
    });
    if (!hit || hit.orgId !== orgId) {
      return NextResponse.json({ error: "Utilisateur introuvable dans le registre." }, { status: 404 });
    }

    hit.user.roles = roles;
    hit.user.updatedAt = new Date().toISOString();
    registry.organizations[orgId].users[hit.index] = hit.user;
    await writeUsersRegistry(registry);
    if (hit.user.clerkUserId) {
      await syncRegistryUserToClerk(orgId, hit.user);
    }

    return NextResponse.json({ success: true, user: hit.user });
  } catch (e) {
    console.error("members PATCH:", e);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const gate = await requireRegistryAdmin();
  if (!gate.ok) return gate.response;
  const { orgId } = gate.ctx;
  const clerkUserId = new URL(req.url).searchParams.get("clerkUserId")?.trim();
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!clerkUserId && !email) {
    return NextResponse.json({ error: "clerkUserId ou email requis" }, { status: 400 });
  }
  try {
    const registry = await readUsersRegistry();
    const hit = findUserInRegistry(registry, { clerkUserId: clerkUserId || undefined, email: email || undefined });
    if (!hit || hit.orgId !== orgId) {
      return NextResponse.json({ error: "Utilisateur introuvable dans le registre." }, { status: 404 });
    }

    registry.organizations[orgId].users.splice(hit.index, 1);
    await writeUsersRegistry(registry);

    if (hit.user.clerkUserId) {
      const client = await clerkClient();
      await client.users.deleteUser(hit.user.clerkUserId);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("members DELETE:", e);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}

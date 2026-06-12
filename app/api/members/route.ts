import { NextResponse } from "next/server";
import { getClerkClientForTenant } from "@/app/lib/tenant-clerk";
import { INTRANET_ROLE_OPTIONS, normalizeIntranetRoles } from "@/app/lib/intranet-roles";
import { requireAdmin } from "@/app/lib/intranet-auth";
import {
  listClerkMembers,
  memberRowFromClerkUser,
  syncClerkUserRoles,
} from "@/app/lib/clerk-users";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  try {
    const users = await listClerkMembers();
    return NextResponse.json({
      users,
      roleOptions: INTRANET_ROLE_OPTIONS,
      source: "clerk",
    });
  } catch (e) {
    console.error("members GET:", e);
    return NextResponse.json({ error: "Impossible de charger les utilisateurs Clerk." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
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

    const client = await getClerkClientForTenant();
    const existing = await client.users.getUserList({ emailAddress: [email], limit: 1 });
    const clerkUser = existing.data?.[0];

    if (clerkUser) {
      await syncClerkUserRoles(clerkUser.id, roles);
      if (firstName || lastName) {
        await client.users.updateUser(clerkUser.id, {
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
        });
      }
      const refreshed = await client.users.getUser(clerkUser.id);
      return NextResponse.json({
        success: true,
        mode: "clerk_existing",
        user: memberRowFromClerkUser(refreshed),
        message: "Utilisateur mis à jour dans Clerk.",
      });
    }

    await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role: roles },
    });

    return NextResponse.json({
      success: true,
      mode: "clerk_invitation",
      user: {
        clerkUserId: "",
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        roles,
        pending: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        displayName: `${firstName} ${lastName}`.trim() || email,
      },
      message: "Invitation Clerk envoyée.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Création impossible";
    console.error("members POST:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  try {
    const body = await req.json();
    const clerkUserId = String(body.clerkUserId ?? body.userId ?? "").trim();
    const roles = normalizeIntranetRoles(body.intranetRoles ?? body.roles);
    if (!clerkUserId) {
      return NextResponse.json({ error: "clerkUserId requis." }, { status: 400 });
    }
    if (roles.length === 0) {
      return NextResponse.json({ error: "Sélectionnez au moins un rôle." }, { status: 400 });
    }

    await syncClerkUserRoles(clerkUserId, roles);
    const client = await getClerkClientForTenant();
    const refreshed = await client.users.getUser(clerkUserId);
    return NextResponse.json({ success: true, user: memberRowFromClerkUser(refreshed) });
  } catch (e) {
    console.error("members PATCH:", e);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const clerkUserId = new URL(req.url).searchParams.get("clerkUserId")?.trim();
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!clerkUserId && !email) {
    return NextResponse.json({ error: "clerkUserId ou email requis" }, { status: 400 });
  }
  try {
    const client = await getClerkClientForTenant();

    if (clerkUserId) {
      await client.users.deleteUser(clerkUserId);
      return NextResponse.json({ success: true });
    }

    const found = await client.users.getUserList({ emailAddress: [email!], limit: 1 });
    const u = found.data?.[0];
    if (u) {
      await client.users.deleteUser(u.id);
      return NextResponse.json({ success: true });
    }

    const invites = await client.invitations.getInvitationList({ status: "pending" });
    const inv = invites.data.find((i) => i.emailAddress?.toLowerCase() === email);
    if (inv) {
      await client.invitations.revokeInvitation(inv.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  } catch (e) {
    console.error("members DELETE:", e);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}

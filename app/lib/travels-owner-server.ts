import "server-only";

import { getClerkClientForTenant } from "@/app/lib/tenant-clerk";
import { userHasAdministratifRole } from "@/app/lib/travels-roles";

export type TravelsOwnerProfile = {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
};

export async function resolveTravelsOwnerFromClerk(
  clerkUserId: string,
): Promise<TravelsOwnerProfile | null> {
  const id = clerkUserId.trim();
  if (!id) return null;
  try {
    const client = await getClerkClientForTenant();
    const u = await client.users.getUser(id);
    const ownerEmail =
      u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
      u.emailAddresses[0]?.emailAddress ??
      "";
    if (!ownerEmail) return null;
    const ownerName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || ownerEmail;
    return { ownerId: u.id, ownerName, ownerEmail };
  } catch {
    return null;
  }
}

type ClerkActor = {
  id?: string | null;
  fullName?: string | null;
  primaryEmailAddress?: { emailAddress?: string } | null;
  publicMetadata?: Record<string, unknown> | null;
};

/** Applique ownerId / ownerName / ownerEmail avec contrôle administratif si tiers. */
export async function applyTravelsOwnerAssignment(
  objectToSave: Record<string, unknown>,
  actor: ClerkActor | null | undefined,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const actorId = actor?.id?.trim() || "";
  const requestedOwnerId = String(objectToSave.ownerId || "").trim();

  if (!requestedOwnerId) {
    if (actorId) {
      objectToSave.ownerId = actorId;
      if (!objectToSave.ownerName) objectToSave.ownerName = actor.fullName || "Enseignant";
      if (!objectToSave.ownerEmail) {
        objectToSave.ownerEmail = actor.primaryEmailAddress?.emailAddress || "";
      }
    }
    return { ok: true };
  }

  if (requestedOwnerId === actorId) {
    const profile = await resolveTravelsOwnerFromClerk(requestedOwnerId);
    if (profile) {
      objectToSave.ownerId = profile.ownerId;
      objectToSave.ownerName = profile.ownerName;
      objectToSave.ownerEmail = profile.ownerEmail;
    }
    return { ok: true };
  }

  if (!userHasAdministratifRole(actor)) {
    return {
      ok: false,
      status: 403,
      error: "Seul l'administratif peut créer ou transférer un dossier pour un autre utilisateur.",
    };
  }

  const profile = await resolveTravelsOwnerFromClerk(requestedOwnerId);
  if (!profile) {
    return {
      ok: false,
      status: 400,
      error: "Utilisateur Clerk introuvable ou sans adresse e-mail.",
    };
  }

  objectToSave.ownerId = profile.ownerId;
  objectToSave.ownerName = profile.ownerName;
  objectToSave.ownerEmail = profile.ownerEmail;
  return { ok: true };
}

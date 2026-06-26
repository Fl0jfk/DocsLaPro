import { safeCurrentUser } from "@/app/lib/intranet-session";

import { canSignTravelsDirectionForEtab } from "@/app/lib/establishments";
import { isTripOwner, isTripOwnerOrCreator } from "@/app/lib/travels-direction-permissions";
import { userHasAdministratifRole, userHasComptaRoleFromMetadata } from "@/app/lib/travels-roles";
import type { TravelsTrip } from "@/app/lib/travels-types";

export function userHasComptaRole(user: { publicMetadata?: Record<string, unknown> } | null): boolean {
  return userHasComptaRoleFromMetadata(user?.publicMetadata);
}

export { userHasAdministratifRole };

export async function assertTravelsTripAccess(
  trip: TravelsTrip,
  opts?: { requireOwnerOrDirection?: boolean; requireDirection?: boolean },
): Promise<{ ok: true; user: NonNullable<NonNullable<Awaited<ReturnType<typeof safeCurrentUser>>>> } | { ok: false; status: number; error: string }> {
  const user = await safeCurrentUser();
  if (!user) return { ok: false, status: 401, error: "Non autorisé" };

  const etab = trip.data?.etablissement;
  const isOwner = isTripOwnerOrCreator(trip, user);
  const canSign = await canSignTravelsDirectionForEtab(user, etab);
  const isCompta = userHasComptaRole(user);
  const isAdmin = userHasAdministratifRole(user);

  if (opts?.requireDirection && !canSign) {
    return { ok: false, status: 403, error: "Réservé à la direction de l'établissement." };
  }

  if (opts?.requireOwnerOrDirection && !isOwner && !canSign && !isCompta) {
    return { ok: false, status: 403, error: "Vous n'êtes pas autorisé(e) sur ce dossier." };
  }

  if (!isOwner && !canSign && !isCompta && !isAdmin) {
    return { ok: false, status: 403, error: "Accès refusé à ce dossier voyage." };
  }

  return { ok: true, user };
}

export { isTripOwner, isTripOwnerOrCreator };

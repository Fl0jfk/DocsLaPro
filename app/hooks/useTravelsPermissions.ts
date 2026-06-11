"use client";

import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";
import {
  canSignTravelsDirectionForEtab,
  isTripOwnerOrCreator,
} from "@/app/lib/travels-direction-permissions";
import type { TravelsTrip } from "@/app/lib/travels-types";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_\s-]+/g, "");

export function useTravelsPermissions(trip: TravelsTrip | null) {
  const { user } = useUser();
  const rawRoles = user?.publicMetadata?.role;
  const userRoles = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];
  const normalizedRoles = userRoles.map((r: string) => norm(String(r)));

  return useMemo(() => {
    const etabForSign = trip?.data?.etablissement || "";
    const isDirection = canSignTravelsDirectionForEtab(user, etabForSign);
    const isCompta =
      userRoles.includes("comptabilité") || normalizedRoles.some((r: string) => r.includes("comptabilite"));
    const isAdministratif = normalizedRoles.some((r: string) => r.includes("administratif"));
    const isOwner = trip ? isTripOwnerOrCreator(trip, user) : false;
    const canManageFiles = isOwner || isDirection || isCompta;
    const canAddDocuments = canManageFiles || isAdministratif;
    const canUseInternalThread = isOwner || isDirection || isCompta;
    const canSeeTravelDocHoverActions = isDirection || isAdministratif || isCompta;
    const canEditEffectif =
      (isOwner || isDirection) &&
      trip != null &&
      !["SEANCE_ANNULEE", "REJETE", "ANNULE"].includes(trip.status);

    return {
      user,
      isOwner,
      isDirection,
      canSign: isDirection,
      isCompta,
      isAdministratif,
      canManageFiles,
      canAddDocuments,
      canUseInternalThread,
      canSeeTravelDocHoverActions,
      canEditEffectif,
    };
  }, [trip, user, userRoles, normalizedRoles]);
}

import type { Establishment } from "@/app/lib/app-config-schemas";

export function getActiveEstablishments(establishments: Establishment[]): Establishment[] {
  return establishments.filter((e) => e.active !== false);
}

export function shouldShowGroupeScolaire(establishments: Establishment[]): boolean {
  return getActiveEstablishments(establishments).length > 1;
}

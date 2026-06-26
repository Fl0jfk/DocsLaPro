import { scolaImageUrl } from "@/app/lib/scola-image";

/** Ancien CDN voyages (bucket retiré) → scola-image, même chemin objet. */
const LEGACY_TRAVEL_IMAGE_HOSTS = new Set(["docslaproimage.s3.eu-west-3.amazonaws.com"]);

/** Réécrit les URLs d'illustration voyages vers le CDN public actuel. */
export function normalizeTravelImageUrl(url: string | undefined | null): string | undefined {
  const trimmed = String(url || "").trim();
  if (!trimmed) return undefined;

  try {
    const parsed = new URL(trimmed);
    if (LEGACY_TRAVEL_IMAGE_HOSTS.has(parsed.hostname)) {
      return scolaImageUrl(decodeURIComponent(parsed.pathname));
    }
  } catch {
    /* URL relative ou invalide — laisser tel quel */
  }

  return trimmed;
}

export function normalizeTripImageFields<T extends { imageUrl?: string; data?: { imageUrl?: string } }>(
  trip: T,
): T {
  const top = normalizeTravelImageUrl(trip.imageUrl);
  const nested = trip.data?.imageUrl ? normalizeTravelImageUrl(trip.data.imageUrl) : undefined;

  if (top === trip.imageUrl && nested === trip.data?.imageUrl) return trip;

  return {
    ...trip,
    ...(top !== undefined ? { imageUrl: top } : {}),
    ...(trip.data
      ? {
          data: {
            ...trip.data,
            ...(nested !== undefined ? { imageUrl: nested } : {}),
          },
        }
      : {}),
  };
}

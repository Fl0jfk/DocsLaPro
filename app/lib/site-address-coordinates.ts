import type { SiteIdentity } from "@/app/lib/app-config-schemas";
import { geocodeFrenchAddress } from "@/app/lib/geocode-address";

/** Complète latitude/longitude si l'adresse textuelle est renseignée mais pas les coordonnées. */
export async function ensureSiteAddressCoordinates(identity: SiteIdentity): Promise<SiteIdentity> {
  const addr = identity.address;
  if (!addr) return identity;
  if (typeof addr.latitude === "number" && typeof addr.longitude === "number") return identity;
  if (!addr.street?.trim() || !addr.city?.trim()) return identity;

  const geo = await geocodeFrenchAddress({
    street: addr.street,
    zip: addr.zip,
    city: addr.city,
  });
  if (!geo) return identity;

  return {
    ...identity,
    address: {
      ...addr,
      latitude: geo.latitude,
      longitude: geo.longitude,
    },
  };
}

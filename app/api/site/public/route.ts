import { NextResponse } from "next/server";
import { loadAppConfig } from "@/app/lib/app-config";
import { getTenant } from "@/app/lib/tenant-context";
import { getSignedReadUrl } from "@/app/lib/s3-storage";
import { parseTravelsS3KeyFromUrl } from "@/app/lib/travels-s3";

/** Identité publique du site (logo header, nom) — sans authentification. */
export async function GET() {
  try {
    const [config, tenant] = await Promise.all([loadAppConfig(), getTenant()]);
    const rawLogo =
      config.identity.headerLogoUrl?.trim() || tenant.logoUrl?.trim() || "";
    let headerLogoUrl: string | null = null;

    if (rawLogo) {
      if (rawLogo.startsWith("http://") || rawLogo.startsWith("https://")) {
        const parsedKey = await parseTravelsS3KeyFromUrl(rawLogo);
        if (parsedKey) {
          headerLogoUrl = (await getSignedReadUrl(parsedKey, 3600)) || rawLogo;
        } else {
          headerLogoUrl = rawLogo;
        }
      } else {
        headerLogoUrl = await getSignedReadUrl(rawLogo, 3600);
      }
    }

    return NextResponse.json({
      name: config.identity.name,
      shortName: config.identity.shortName,
      headerLogoUrl,
    });
  } catch (e) {
    console.error("[site/public]", e);
    return NextResponse.json({ error: "Configuration indisponible." }, { status: 500 });
  }
}

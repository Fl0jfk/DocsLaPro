import { NextResponse } from "next/server";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { requireAuth } from "@/app/lib/intranet-auth";
import { resolveEleveFolderName } from "@/app/lib/eleves-config";
import { loadElevesRegistry } from "@/app/lib/eleves-registry";
import { loadMefSecteurMap } from "@/app/lib/mef-secteurs";
import {
  buildElevesPoolForOcrMatching,
  oneDrivePathForEleve,
} from "@/app/lib/onedrive-eleves";
import { resolveOneDriveProfileForClerkUserServer } from "@/app/lib/onedrive-user-profiles.server";

export async function GET() {
  try {
    const gate = await requireAuth();
    if (!gate.ok) return gate.response;

    const user = await safeCurrentUser();
    const profile = user
      ? await resolveOneDriveProfileForClerkUserServer({
          lastName: user.lastName,
          emailAddresses: user.emailAddresses?.map((e) => ({ emailAddress: e.emailAddress })),
          primaryEmailAddress: user.primaryEmailAddress
            ? { emailAddress: user.primaryEmailAddress.emailAddress }
            : null,
        })
      : null;
    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Profil OneDrive inconnu pour votre compte. Configurez le mapping utilisateur → cycle dans Paramètres → Intégrations.",
        },
        { status: 403 },
      );
    }

    const mefMap = await loadMefSecteurMap();
    const allEleves = await loadElevesRegistry();
    const { eleves, secteurFilterApplied } = buildElevesPoolForOcrMatching(allEleves, profile, mefMap);
    const pool = eleves.length > 0 ? eleves : allEleves;

    const sorted = [...pool].sort((a, b) => {
      const na = `${a.nom} ${a.prenom}`.toLowerCase();
      const nb = `${b.nom} ${b.prenom}`.toLowerCase();
      return na.localeCompare(nb, "fr");
    });

    return NextResponse.json({
      secteur: profile.secteur,
      secteurLabel: profile.label,
      basePath: profile.basePath,
      secteurFilterApplied,
      eleves: sorted.map((e) => {
        const folderName = resolveEleveFolderName(e);
        return {
          ine: e.ine,
          nom: e.nom,
          prenom: e.prenom,
          folderName,
          classe: e.classe ?? null,
          targetFolderPath: oneDrivePathForEleve(profile.basePath, folderName),
        };
      }),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

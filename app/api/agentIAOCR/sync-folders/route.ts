import { safeCurrentUser } from "@/app/lib/intranet-session";
import { NextResponse } from "next/server";

import { requireAuth } from "@/app/lib/intranet-auth";
import { getJson } from "@/app/lib/s3-storage";
import type { EleveConfig } from "@/app/lib/eleves-config";
import { resolveEleveFolderName } from "@/app/lib/eleves-config";
import { listChildFolderNames, ensureChildFolder, ensureFolderPath } from "@/app/lib/graph-onedrive-folders";
import { loadMefSecteurMap } from "@/app/lib/mef-secteurs";
import {
  filterElevesForSecteur,
  getOneDriveProfileForClerkUser,
  resolveEleveSecteur,
} from "@/app/lib/onedrive-eleves";

const KEY = "eleves.json";

export async function POST(req: Request) {
  try {
    const gate = await requireAuth();
    if (!gate.ok) return gate.response;

    const user = await safeCurrentUser();
    const profile = user ? getOneDriveProfileForClerkUser(user) : null;
    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Profil OneDrive inconnu pour votre compte. Ajoutez votre nom dans onedrive-eleves.ts (comme pour les 3 secrétariats).",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const accessToken = String(body.accessToken ?? "").trim();
    if (!accessToken) {
      return NextResponse.json({ error: "accessToken OneDrive requis" }, { status: 400 });
    }

    const mefMap = await loadMefSecteurMap();
    const mefTableConfigured = mefMap.size > 0;

    const hit = await getJson<EleveConfig[]>( KEY);
    const allEleves = Array.isArray(hit?.data) ? hit.data : [];
    const scoped = filterElevesForSecteur(allEleves, profile.secteur, mefMap);

    await ensureFolderPath(accessToken, profile.basePath);
    const existingOnDrive = await listChildFolderNames(accessToken, profile.basePath);
    const existing = new Set(existingOnDrive);

    const created: string[] = [];
    const alreadyThere: string[] = [];
    const ambiguous: Array<{ folderName: string; mef?: string; reason: string }> = [];
    const errors: Array<{ folderName: string; error: string }> = [];
    const currentStudentFolders = new Set<string>();

    for (const e of scoped) {
      const folderName = resolveEleveFolderName(e);
      const inferred = resolveEleveSecteur(e, mefMap);
      if (!inferred) {
        const mef = String(e.mef ?? "").trim();
        ambiguous.push({
          folderName,
          mef: mef || undefined,
          reason: mefTableConfigured
            ? mef
              ? "MEF inconnu dans la table"
              : "MEF manquant sur l'élève"
            : "Secteur non détecté (table MEF absente et nom de dossier ambigu)",
        });
        continue;
      }
      if (inferred !== profile.secteur) continue;

      currentStudentFolders.add(folderName);

      if (existing.has(folderName)) {
        alreadyThere.push(folderName);
        continue;
      }
      try {
        const r = await ensureChildFolder(accessToken, profile.basePath, folderName);
        existing.add(folderName);
        if (r.created) created.push(folderName);
        else alreadyThere.push(folderName);
      } catch (err) {
        errors.push({
          folderName,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const extraFoldersOnOneDrive = [...existingOnDrive]
      .filter((name) => !currentStudentFolders.has(name))
      .sort((a, b) => a.localeCompare(b, "fr"));

    const otherSecteurCounts = {
      lycee: filterElevesForSecteur(allEleves, "lycee", mefMap).length,
      college: filterElevesForSecteur(allEleves, "college", mefMap).length,
      ecole: filterElevesForSecteur(allEleves, "ecole", mefMap).length,
    };

    return NextResponse.json({
      success: true,
      mefTableConfigured,
      mefCodesInTable: mefMap.size,
      secteur: profile.secteur,
      secteurLabel: profile.label,
      basePath: profile.basePath,
      jsonTotal: allEleves.length,
      jsonForYourSecteur: scoped.length,
      oneDriveFoldersFound: existingOnDrive.size,
      created: created.length,
      alreadyThere: alreadyThere.length,
      createdFolders: created.sort((a, b) => a.localeCompare(b, "fr")),
      extraFoldersOnOneDrive,
      extraFoldersCount: extraFoldersOnOneDrive.length,
      ambiguousCount: ambiguous.length,
      ambiguous: ambiguous.slice(0, 30),
      errors,
      otherSecteurCounts,
      message:
        created.length > 0
          ? `${created.length} dossier(s) créé(s), ${alreadyThere.length} déjà présent(s) pour les élèves de la liste actuelle.`
          : alreadyThere.length > 0
            ? `Aucun nouveau dossier : ${alreadyThere.length} élève(s) de la liste avaient déjà leur dossier.`
            : "Aucun dossier créé — vérifiez la liste élèves et la table MEF.",
    });
  } catch (e) {
    console.error("sync-folders:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

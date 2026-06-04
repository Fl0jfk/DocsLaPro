import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { getTenantJson } from "@/app/lib/tenant-s3-storage";
import type { EleveConfig } from "@/app/lib/eleves-config";
import { listChildFolderNames, ensureChildFolder, ensureFolderPath } from "@/app/lib/graph-onedrive-folders";
import { loadMefSecteurMap } from "@/app/lib/mef-secteurs";
import {
  filterElevesForSecteur,
  getOneDriveProfileForClerkLastName,
  resolveEleveSecteur,
} from "@/app/lib/onedrive-eleves";

const KEY = "eleves.json";

export async function POST(req: Request) {
  try {
    const gate = await requireTenantAuth();
    if (!gate.ok) return gate.response;

    const user = await currentUser();
    const lastName = (user?.lastName || "").trim();
    const profile = getOneDriveProfileForClerkLastName(lastName);
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

    const mefMap = await loadMefSecteurMap(gate.ctx.orgId);
    const mefTableConfigured = mefMap.size > 0;

    const hit = await getTenantJson<EleveConfig[]>(gate.ctx.orgId, KEY);
    const allEleves = Array.isArray(hit?.data) ? hit.data : [];
    const scoped = filterElevesForSecteur(allEleves, profile.secteur, mefMap);

    await ensureFolderPath(accessToken, profile.basePath);
    const existing = await listChildFolderNames(accessToken, profile.basePath);

    const created: string[] = [];
    const alreadyThere: string[] = [];
    const ambiguous: Array<{ folderName: string; mef?: string; reason: string }> = [];
    const errors: Array<{ folderName: string; error: string }> = [];

    for (const e of scoped) {
      const inferred = resolveEleveSecteur(e, mefMap);
      if (!inferred) {
        const mef = String(e.mef ?? "").trim();
        ambiguous.push({
          folderName: e.folderName,
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

      if (existing.has(e.folderName)) {
        alreadyThere.push(e.folderName);
        continue;
      }
      try {
        const r = await ensureChildFolder(accessToken, profile.basePath, e.folderName);
        existing.add(e.folderName);
        if (r.created) created.push(e.folderName);
        else alreadyThere.push(e.folderName);
      } catch (err) {
        errors.push({
          folderName: e.folderName,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

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
      oneDriveFoldersFound: existing.size,
      created: created.length,
      alreadyThere: alreadyThere.length,
      createdFolders: created.slice(0, 50),
      ambiguous: ambiguous.slice(0, 20),
      errors,
      otherSecteurCounts,
      message: `${created.length} dossier(s) créé(s), ${alreadyThere.length} déjà présent(s) sous ${profile.basePath}. Les élèves des autres secteurs ne sont pas touchés.`,
    });
  } catch (e) {
    console.error("sync-folders:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

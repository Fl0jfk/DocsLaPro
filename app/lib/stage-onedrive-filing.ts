import { loadAppConfig } from "@/app/lib/app-config";
import { uploadFileToOneDriveFolder } from "@/app/lib/graph-onedrive-folders";
import { conventionOneDriveFileName, matchEleveForConvention } from "@/app/lib/stage-eleve-match";
import { buildStageConventionPdf } from "@/app/lib/stage-pdf";
import { getStageConvention, saveStageConvention } from "@/app/lib/stage-storage";
import type { OneDriveUserProfile } from "@/app/lib/onedrive-user-profiles";
import type { StageConvention } from "@/app/lib/stage-types";

export async function verifyOneDriveAccessToken(accessToken: string): Promise<boolean> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me/drive?$select=id", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.ok;
}

export async function isOneDriveIntegrationEnabled(): Promise<boolean> {
  const config = await loadAppConfig();
  return config.integrations.microsoftOneDrive?.enabled === true;
}

export async function fileSignedConventionToOneDrive(params: {
  conventionId: string;
  accessToken: string;
  odProfile: OneDriveUserProfile;
  filedBy: string;
}): Promise<
  | {
      ok: true;
      convention: StageConvention;
      folderPath: string;
      fileName: string;
      fullPath: string;
      matchedFolderName: string;
    }
  | { ok: false; error: string; debug?: Record<string, unknown> }
> {
  const enabled = await isOneDriveIntegrationEnabled();
  if (!enabled) {
    return { ok: false, error: "OneDrive n'est pas activé pour cet établissement (Paramètres → Intégrations)." };
  }

  const tokenOk = await verifyOneDriveAccessToken(params.accessToken);
  if (!tokenOk) {
    return {
      ok: false,
      error: "Session OneDrive invalide ou expirée. Reconnectez-vous à Microsoft.",
    };
  }

  const convention = await getStageConvention(params.conventionId);
  if (!convention) return { ok: false, error: "Convention introuvable." };
  if (convention.status !== "signed") {
    return { ok: false, error: "La convention doit être signée par toutes les parties avant envoi." };
  }

  const { matchedEleve, folderPath, debug } = await matchEleveForConvention(convention, params.odProfile);
  if (!matchedEleve || !folderPath) {
    return {
      ok: false,
      error:
        "Élève introuvable dans eleves.json ou profil OneDrive non reconnu pour votre compte. Vérifiez la liste élèves et votre profil secrétariat.",
      debug,
    };
  }

  const pdfBytes = await buildStageConventionPdf(convention);
  const fileName = conventionOneDriveFileName(convention);

  const uploaded = await uploadFileToOneDriveFolder(
    params.accessToken,
    folderPath,
    fileName,
    pdfBytes,
  );

  const now = new Date().toISOString();
  const next: StageConvention = {
    ...convention,
    updatedAt: now,
    oneDriveFiling: {
      filedAt: now,
      filedBy: params.filedBy,
      folderPath: uploaded.folderPath,
      fileName: uploaded.fileName,
      matchedFolderName: matchedEleve.folderName,
    },
    history: [
      ...convention.history,
      {
        at: now,
        by: params.filedBy,
        action: "ONEDRIVE_DEPOSE",
        note: uploaded.fullPath,
      },
    ],
  };
  await saveStageConvention(next);

  return {
    ok: true,
    convention: next,
    folderPath: uploaded.folderPath,
    fileName: uploaded.fileName,
    fullPath: uploaded.fullPath,
    matchedFolderName: matchedEleve.folderName,
  };
}

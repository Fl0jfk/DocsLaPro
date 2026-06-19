'use client';
import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import * as msal from "@azure/msal-browser";
import { buildTextFromPages } from "@/app/lib/eleves-config";
import { consumeDashboardUpload } from "@/app/lib/dashboard-upload-bridge";
import { getOneDriveProfileForClerkUser } from "@/app/lib/onedrive-user-profiles";

const ONEDRIVE_SCOPES = ["Files.ReadWrite", "User.Read"];

let msalInstance: msal.PublicClientApplication | null = null;

function getMsalInstance() {
  if (!msalInstance) throw new Error("MSAL non initialisé");
  return msalInstance;
}

type ProcessResult = {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
  error?: string;
  fileName: string;
  /** Chemin OneDrive (ex. Temp/monfichier.pdf) si le fichier est resté dans Temp */
  tempOneDrivePath?: string;
};

type OcrData = {
  text: string;
  pageTexts: Record<string, string>;
  pageCount: number;
};

type Segment = {
  pageStart: number;
  pageEnd: number;
  label?: string;
};

function OneDriveUpDocsOCRAIContent() {
  const searchParams = useSearchParams();
  const { user: clerkUser } = useUser();
  const oneDriveProfile = useMemo(
    () => (clerkUser ? getOneDriveProfileForClerkUser(clerkUser) : null),
    [clerkUser],
  );
  const [account, setAccount] = useState<msal.AccountInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [msalReady, setMsalReady] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<ProcessResult[]>([]);
  const [processingStatus, setProcessingStatus] = useState({
    total: 0,
    completed: 0,
    failed: 0,
  });
  const [pendingStandardFiles, setPendingStandardFiles] = useState<File[]>([]);
  const [pendingClassFiles, setPendingClassFiles] = useState<File[]>([]);
  const [isDraggingStandard, setIsDraggingStandard] = useState(false);
  const [isDraggingClass, setIsDraggingClass] = useState(false);

  const [elevesCount, setElevesCount] = useState<number | null>(null);
  const [elevesUploading, setElevesUploading] = useState(false);
  const [elevesMessage, setElevesMessage] = useState("");
  const [syncingFolders, setSyncingFolders] = useState(false);
  const [syncReport, setSyncReport] = useState<{
    message?: string;
    secteurLabel?: string;
    basePath?: string;
    jsonForYourSecteur?: number;
    created?: number;
    alreadyThere?: number;
    ambiguous?: Array<{ folderName: string; mef?: string; reason?: string }>;
    otherSecteurCounts?: Record<string, number>;
    mefTableConfigured?: boolean;
  } | null>(null);
  const [mefCounts, setMefCounts] = useState<{ total: number; lycee: number; college: number; ecole: number } | null>(
    null,
  );
  const [mefUploading, setMefUploading] = useState(false);
  const [mefMessage, setMefMessage] = useState("");
  const elevesInputRef = useRef<HTMLInputElement | null>(null);
  const mefInputRef = useRef<HTMLInputElement | null>(null);
  const standardInputRef = useRef<HTMLInputElement | null>(null);
  const classInputRef = useRef<HTMLInputElement | null>(null);
  const oneDriveTokenRef = useRef<string | null>(null);
  const [checkingOneDrive, setCheckingOneDrive] = useState(false);
  const [oneDriveVerified, setOneDriveVerified] = useState(false);

  const applyOneDriveSession = useCallback((activeAccount: msal.AccountInfo | null, token: string | null) => {
    setAccount(activeAccount);
    setAccessToken(token);
    oneDriveTokenRef.current = token;
    setOneDriveVerified(Boolean(token));
  }, []);

  const ensureOneDriveConnection = useCallback(async (): Promise<string | null> => {
    if (!msalReady) {
      setError("Initialisation Microsoft en cours… Réessayez dans quelques secondes.");
      return null;
    }
    setCheckingOneDrive(true);
    try {
      const accounts = getMsalInstance().getAllAccounts();
      if (accounts.length === 0) {
        applyOneDriveSession(null, null);
        setError("Connectez-vous à OneDrive avant de déposer des fichiers (bouton en haut à droite).");
        return null;
      }
      const activeAccount = accounts[0];
      let token: string;
      try {
        const tokenResponse = await getMsalInstance().acquireTokenSilent({
          account: activeAccount,
          scopes: ONEDRIVE_SCOPES,
        });
        token = tokenResponse.accessToken;
      } catch (err) {
        if (err instanceof msal.InteractionRequiredAuthError) {
          const tokenResponse = await getMsalInstance().acquireTokenPopup({
            account: activeAccount,
            scopes: ONEDRIVE_SCOPES,
          });
          token = tokenResponse.accessToken;
        } else {
          throw err;
        }
      }

      const verifyRes = await fetch("https://graph.microsoft.com/v1.0/me/drive?$select=id", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!verifyRes.ok) {
        throw new Error("Session OneDrive expirée ou accès refusé. Reconnectez-vous.");
      }

      applyOneDriveSession(activeAccount, token);
      setError("");
      return token;
    } catch (err: unknown) {
      applyOneDriveSession(getMsalInstance().getAllAccounts()[0] ?? null, null);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`OneDrive indisponible : ${msg}`);
      return null;
    } finally {
      setCheckingOneDrive(false);
    }
  }, [applyOneDriveSession, msalReady]);

  const loadElevesCount = useCallback(async () => {
    try {
      const res = await fetch("/api/eleves");
      if (!res.ok) return;
      const data = await res.json();
      setElevesCount(data.count ?? (Array.isArray(data.eleves) ? data.eleves.length : null));
    } catch {
      /* ignore */
    }
  }, []);

  const loadMefCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/mef-secteurs");
      if (!res.ok) return;
      const data = await res.json();
      if (data.counts) setMefCounts(data.counts);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const tenantRes = await fetch("/api/tenant/public");
        const tenant = await tenantRes.json();
        const ms = tenant.microsoftOneDrive;
        if (!ms?.enabled || !ms.clientId || !ms.tenantId) {
          setError("OneDrive n'est pas activé pour cet établissement. Activez-le dans Paramètres → Intégrations.");
          setMsalReady(true);
          return;
        }
        const redirectUri =
          typeof window !== "undefined" ? `${window.location.origin}/agentIAOCR` : "/agentIAOCR";
        msalInstance = new msal.PublicClientApplication({
          auth: {
            clientId: ms.clientId,
            authority: `https://login.microsoftonline.com/${ms.tenantId}`,
            redirectUri,
          },
          cache: {
            cacheLocation: "localStorage",
          },
        });
        await getMsalInstance().initialize();
        setMsalReady(true);
        const accounts = getMsalInstance().getAllAccounts();
        if (accounts.length > 0) {
          try {
            const tokenResponse = await getMsalInstance().acquireTokenSilent({
              account: accounts[0],
              scopes: ONEDRIVE_SCOPES,
            });
            const verifyRes = await fetch("https://graph.microsoft.com/v1.0/me/drive?$select=id", {
              headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
            });
            if (verifyRes.ok) {
              applyOneDriveSession(accounts[0], tokenResponse.accessToken);
            } else {
              applyOneDriveSession(accounts[0], null);
            }
          } catch {
            applyOneDriveSession(accounts[0], null);
          }
        }
        await loadElevesCount();
        await loadMefCounts();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError("Erreur init MSAL: " + err.message);
      }
    };
    init();
  }, [applyOneDriveSession, loadElevesCount, loadMefCounts]);

  useEffect(() => {
    if (searchParams.get("upload") !== "1") return;
    requestAnimationFrame(() => {
      const el = document.getElementById("ocr-drop-standard");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ring-4", "ring-violet-400");
      window.setTimeout(() => el?.classList.remove("ring-4", "ring-violet-400"), 2500);
    });
  }, [searchParams, msalReady]);

  useEffect(() => {
    if (!msalReady) return;
    const staged = consumeDashboardUpload();
    if (!staged) return;
    (async () => {
      const token = await ensureOneDriveConnection();
      if (!token) return;
      if (staged.mode === "standard") {
        setPendingStandardFiles((prev) => [...prev, ...staged.files]);
      } else {
        setPendingClassFiles((prev) => [...prev, ...staged.files]);
      }
    })();
  }, [ensureOneDriveConnection, msalReady]);

  useEffect(() => {
    if (!msalReady) return;
    const handleRedirect = async () => {
      try {
        const result = await getMsalInstance().handleRedirectPromise();
        if (result?.account) {
          const tokenResponse = await getMsalInstance().acquireTokenSilent({
            account: result.account,
            scopes: ONEDRIVE_SCOPES,
          });
          const verifyRes = await fetch("https://graph.microsoft.com/v1.0/me/drive?$select=id", {
            headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
          });
          if (verifyRes.ok) {
            applyOneDriveSession(result.account, tokenResponse.accessToken);
          } else {
            applyOneDriveSession(result.account, null);
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError("Erreur login redirect: " + err.message);
      }
    };
    handleRedirect();
  }, [applyOneDriveSession, msalReady]);

  const login = async () => {
    if (!msalReady) {
      setError("MSAL n'est pas encore initialisé.");
      return;
    }
    setError("");
    try {
      const result = await getMsalInstance().loginPopup({
        scopes: ONEDRIVE_SCOPES,
        prompt: "select_account",
      });
      const verifyRes = await fetch("https://graph.microsoft.com/v1.0/me/drive?$select=id", {
        headers: { Authorization: `Bearer ${result.accessToken}` },
      });
      if (!verifyRes.ok) {
        throw new Error(
          "Accès OneDrive refusé pour ce compte Microsoft. Utilisez le compte professionnel de l'établissement.",
        );
      }
      applyOneDriveSession(result.account, result.accessToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err instanceof msal.BrowserAuthError && err.errorCode === "user_cancelled") {
        setError("Connexion annulée.");
        return;
      }
      if (err instanceof msal.BrowserAuthError && err.errorCode === "interaction_in_progress") {
        setError("Une connexion Microsoft est déjà en cours. Fermez la fenêtre Microsoft et réessayez.");
        return;
      }
      setError(
        `Erreur connexion OneDrive : ${err?.message || "échec inconnu"}. Choisissez votre compte professionnel (@ac-normandie.fr ou @laprovidence-nicolasbarre.fr).`,
      );
    }
  };

  const pollOcr = async (jobId: string, maxAttempts: number): Promise<OcrData> => {
    for (let i = 0; i < maxAttempts; i++) {
      const r = await fetch("/api/agentIAOCR/ocr-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      if (data.text) {
        return {
          text: data.text,
          pageTexts: data.pageTexts || {},
          pageCount: data.pageCount || 0,
        };
      }
      if (data.status === "IN_PROGRESS") {
        await new Promise((res) => setTimeout(res, 5000));
      } else {
        throw new Error("OCR Textract a échoué : " + JSON.stringify(data));
      }
    }
    throw new Error("Timeout OCR : aucun texte retourné");
  };

  const uploadToS3AndOneDrive = async (
    file: File,
    token: string
  ): Promise<{ key: string; tempPath: string }> => {
    const r1 = await fetch("/api/agentIAOCR/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type || "application/pdf" }),
    });
    if (!r1.ok) throw new Error(await r1.text());
    const { url, key } = await r1.json();
    const upload = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/pdf" },
      body: file,
    });
    if (!upload.ok) throw new Error("Échec upload S3 : " + (await upload.text()));

    const tempPath = `Temp/${file.name}`;
    const odRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${tempPath}:/content`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": file.type || "application/pdf",
        },
        body: file,
      }
    );
    if (!odRes.ok) {
      throw new Error("Échec upload OneDrive Temp : " + (await odRes.text()));
    }
    return { key, tempPath };
  };

  const deleteOneDrivePath = async (token: string, itemPath: string) => {
    try {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${itemPath}:`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok && res.status !== 404) {
        console.warn("[agentIAOCR] Suppression Temp:", itemPath, await res.text());
      }
    } catch (e) {
      console.warn("[agentIAOCR] Suppression Temp:", itemPath, e);
    }
  };

  const segmentTempFileName = (
    originalName: string,
    pageStart: number,
    pageEnd: number,
    index: number
  ) => {
    const base = originalName.replace(/\.pdf$/i, "").replace(/[<>:"/\\|?*]/g, "_");
    return `Temp/${base}_p${pageStart}-${pageEnd}_${index + 1}.pdf`;
  };

  const analyzeAndMove = async (
    token: string,
    text: string,
    sourcePath: string,
    displayName: string
  ): Promise<ProcessResult> => {
    try {
      const r4 = await fetch("/api/agentIAOCR/analyze-doc-match-eleve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!r4.ok) throw new Error(await r4.text());
      const ai = await r4.json();
      if (!ai?.fileName) {
        return {
          success: false,
          error: "Analyse IA incomplète.",
          fileName: displayName,
          result: ai,
          tempOneDrivePath: sourcePath,
        };
      }
      const newFileName = `${ai.fileName}.pdf`;
      const targetFolderPath = ai.oneDriveFolderPath || null;
      if (!targetFolderPath) {
        return {
          success: false,
          error:
            "Élève non identifié — le fichier reste dans le dossier Temp. Rangez-le à la main dans le dossier élève, ou repassez-le en mode Standard (un PDF = un document).",
          fileName: displayName,
          result: ai,
          tempOneDrivePath: sourcePath,
        };
      }
      const moveRes = await fetch("/api/agentIAOCR/move-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: token,
          sourcePath,
          targetFolderPath,
          newFileName,
        }),
      });
      if (!moveRes.ok) {
        throw new Error(
          "Le fichier n'a pas pu être déplacé : " + (await moveRes.text())
        );
      }
      return { success: true, result: ai, fileName: displayName };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: message,
        fileName: displayName,
        tempOneDrivePath: sourcePath,
      };
    }
  };

  const processSingleFile = async (file: File): Promise<ProcessResult> => {
    try {
      const token = oneDriveTokenRef.current;
      if (!token) throw new Error("Pas de token OneDrive disponible");
      const { key, tempPath } = await uploadToS3AndOneDrive(file, token);
      const r2 = await fetch("/api/agentIAOCR/ocr-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!r2.ok) throw new Error(await r2.text());
      const { jobId } = await r2.json();
      if (!jobId) throw new Error("Impossible de lancer Textract");
      const ocr = await pollOcr(jobId, 30);
      return await analyzeAndMove(token, ocr.text, tempPath, file.name);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: message,
        fileName: file.name,
        tempOneDrivePath: `Temp/${file.name}`,
      };
    }
  };

  const processClassFile = async (file: File): Promise<ProcessResult[]> => {
    const results: ProcessResult[] = [];
    const sourceTempPath = `Temp/${file.name}`;
    try {
      const token = oneDriveTokenRef.current;
      if (!token) throw new Error("Pas de token OneDrive disponible");
      const { key } = await uploadToS3AndOneDrive(file, token);

      const r2 = await fetch("/api/agentIAOCR/ocr-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!r2.ok) throw new Error(await r2.text());
      const { jobId } = await r2.json();
      if (!jobId) throw new Error("Impossible de lancer Textract");

      const ocr = await pollOcr(jobId, 60);

      const segRes = await fetch("/api/agentIAOCR/segment-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageTexts: ocr.pageTexts,
          pageCount: ocr.pageCount,
        }),
      });
      if (!segRes.ok) throw new Error(await segRes.text());
      const segData = await segRes.json();
      const segments: Segment[] = segData.segments || [];
      const mode = segData.mode as string;

      if (mode === "single" || segments.length <= 1) {
        const seg = segments[0] || { pageStart: 1, pageEnd: ocr.pageCount || 1 };
        const slice = buildTextFromPages(ocr.pageTexts, seg.pageStart, seg.pageEnd, ocr.text);
        const one = await analyzeAndMove(
          token,
          slice || ocr.text,
          sourceTempPath,
          file.name
        );
        results.push(one);
        return results;
      }

      await deleteOneDrivePath(token, sourceTempPath);

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const label = `${file.name} [p.${seg.pageStart}-${seg.pageEnd}]`;
        let tempSegPath: string | undefined;
        try {
          const slice = buildTextFromPages(
            ocr.pageTexts,
            seg.pageStart,
            seg.pageEnd,
            ocr.text,
          );
          if (!slice.trim()) {
            results.push({
              success: false,
              error:
                "Aucun texte OCR sur ce segment — pas de PDF généré. Réexportez ce document si besoin.",
              fileName: label,
            });
            continue;
          }

          const extractRes = await fetch("/api/agentIAOCR/extract-pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key,
              pageStart: seg.pageStart,
              pageEnd: seg.pageEnd,
              filename: `${file.name.replace(/\.pdf$/i, "")}_seg${i + 1}`,
            }),
          });
          if (!extractRes.ok) {
            throw new Error(await extractRes.text());
          }
          const { downloadUrl } = await extractRes.json();
          const pdfRes = await fetch(downloadUrl);
          if (!pdfRes.ok) throw new Error("Téléchargement du segment PDF échoué");
          const pdfBlob = await pdfRes.blob();

          tempSegPath = segmentTempFileName(
            file.name,
            seg.pageStart,
            seg.pageEnd,
            i
          );
          const odPut = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/root:/${tempSegPath}:/content`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/pdf",
              },
              body: pdfBlob,
            }
          );
          if (!odPut.ok) {
            throw new Error("Upload segment OneDrive : " + (await odPut.text()));
          }

          const r4 = await fetch("/api/agentIAOCR/analyze-doc-match-eleve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: slice }),
          });
          if (!r4.ok) throw new Error(await r4.text());
          const ai = await r4.json();

          if (!ai?.fileName || !ai.oneDriveFolderPath) {
            results.push({
              success: false,
              error:
                "Élève non identifié sur ce segment — le PDF découpé reste dans Temp. Rangez-le à la main ou repassez-le en mode Standard.",
              fileName: label,
              result: ai,
              tempOneDrivePath: tempSegPath,
            });
            continue;
          }

          const segmentOdName = `${ai.fileName}.pdf`;

          const moveRes = await fetch("/api/agentIAOCR/move-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken: token,
              sourcePath: tempSegPath,
              targetFolderPath: ai.oneDriveFolderPath,
              newFileName: segmentOdName,
            }),
          });
          if (!moveRes.ok) {
            throw new Error(await moveRes.text());
          }
          results.push({ success: true, result: ai, fileName: label });
        } catch (segErr: unknown) {
          const msg = segErr instanceof Error ? segErr.message : String(segErr);
          results.push({
            success: false,
            error: tempSegPath
              ? `${msg} — document découpé laissé dans Temp.`
              : msg,
            fileName: label,
            tempOneDrivePath: tempSegPath,
          });
        }
        await new Promise((r) => setTimeout(r, 800));
      }

      return results;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        success: false,
        error: message,
        fileName: file.name,
        tempOneDrivePath: sourceTempPath,
      });
      return results;
    }
  };

  async function processInBatches<T, R>(
    items: T[],
    batchSize: number,
    processFn: (item: T) => Promise<R>,
    onProgress: (results: R[]) => void
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processFn));
      results.push(...batchResults);
      onProgress(results);
      if (i + batchSize < items.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    return results;
  }

  const updateProgress = (results: ProcessResult[]) => {
    setProcessingStatus({
      total: results.length,
      completed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });
  };

  const runProcessing = async (
    standardFiles: File[],
    classFiles: File[]
  ) => {
    const token = await ensureOneDriveConnection();
    if (!token) return;
    setOcrProcessing(true);
    setError("");
    setOcrResults([]);
    const allResults: ProcessResult[] = [];

    const estimatedTotal =
      standardFiles.length +
      classFiles.length * 5;
    setProcessingStatus({ total: estimatedTotal, completed: 0, failed: 0 });

    try {
      if (standardFiles.length > 0) {
        const flat = await processInBatches(
          standardFiles,
          2,
          processSingleFile,
          () => {}
        );
        allResults.push(...flat);
        updateProgress(allResults);
      }

      for (const file of classFiles) {
        const segmentResults = await processClassFile(file);
        allResults.push(...segmentResults);
        updateProgress(allResults);
        await new Promise((r) => setTimeout(r, 1500));
      }

      setProcessingStatus({
        total: allResults.length,
        completed: allResults.filter((r) => r.success).length,
        failed: allResults.filter((r) => !r.success).length,
      });
      setOcrResults(allResults);
    } catch (err: unknown) {
      setError(
        "Erreur globale OCR / Analyse: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setOcrProcessing(false);
      if (standardInputRef.current) standardInputRef.current.value = "";
      if (classInputRef.current) classInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const hasWork =
      pendingStandardFiles.length > 0 || pendingClassFiles.length > 0;
    if (!ocrProcessing && hasWork && msalReady) {
      const standard = pendingStandardFiles;
      const classF = pendingClassFiles;
      setPendingStandardFiles([]);
      setPendingClassFiles([]);
      runProcessing(standard, classF);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pendingStandardFiles,
    pendingClassFiles,
    ocrProcessing,
    msalReady,
  ]);

  const enqueueStandard = async (fileList: FileList | File[]) => {
    const token = await ensureOneDriveConnection();
    if (!token) return;
    const pdfs = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf"),
    );
    if (pdfs.length === 0) {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    setPendingStandardFiles((prev) => [...prev, ...pdfs]);
  };

  const enqueueClass = async (fileList: FileList | File[]) => {
    const token = await ensureOneDriveConnection();
    if (!token) return;
    const pdfs = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf"),
    );
    if (pdfs.length === 0) {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (pdfs.length !== Array.from(fileList).length) {
      setError("Seuls les fichiers PDF sont acceptés.");
    }
    setPendingClassFiles((prev) => [...prev, ...pdfs]);
  };

  const handleSyncOneDriveFolders = async () => {
    const token = await ensureOneDriveConnection();
    if (!token) return;
    setSyncingFolders(true);
    setSyncReport(null);
    setElevesMessage("");
    try {
      const res = await fetch("/api/agentIAOCR/sync-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec synchronisation");
      setSyncReport(data);
      setElevesMessage(data.message || "Synchronisation terminée.");
    } catch (e: unknown) {
      setElevesMessage("Erreur : " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSyncingFolders(false);
    }
  };

  const handleMefUpload = async (file: File) => {
    setMefUploading(true);
    setMefMessage("");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch("/api/mef-secteurs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec enregistrement MEF");
      if (data.counts) setMefCounts(data.counts);
      setMefMessage(data.message || "Table MEF enregistrée.");
    } catch (e: unknown) {
      setMefMessage("Erreur : " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setMefUploading(false);
      if (mefInputRef.current) mefInputRef.current.value = "";
    }
  };

  const handleElevesUpload = async (file: File) => {
    setElevesUploading(true);
    setElevesMessage("");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch("/api/eleves", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la mise à jour");
      setElevesCount(data.count);
      setElevesMessage(data.message || `Liste mise à jour (${data.count} élèves).`);
    } catch (e: unknown) {
      setElevesMessage(
        "Erreur : " + (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setElevesUploading(false);
      if (elevesInputRef.current) elevesInputRef.current.value = "";
    }
  };

  if (!msalReady) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium">Initialisation de MSAL...</p>
        </div>
      </div>
    );
  }

  const dropsAvailable = oneDriveVerified && Boolean(accessToken);
  const dropDisabled = !dropsAvailable || ocrProcessing || checkingOneDrive;
  const progressPercent =
    processingStatus.total > 0
      ? ((processingStatus.completed + processingStatus.failed) /
          processingStatus.total) *
        100
      : 0;

  const dropZoneClass = (active: boolean, variant: "blue" | "violet") => {
    if (!dropsAvailable) {
      return "relative overflow-hidden border-2 border-dashed rounded-3xl p-10 text-center border-slate-200 bg-slate-50/90 cursor-not-allowed opacity-80";
    }
    return `relative overflow-hidden border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 group
    ${active ? (variant === "violet" ? "border-violet-600 bg-violet-50 scale-[1.01]" : "border-blue-600 bg-blue-50 scale-[1.01]") : "border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50"}
    ${dropDisabled ? "opacity-60 cursor-not-allowed shadow-none" : "cursor-pointer shadow-lg hover:shadow-xl"}
    ${ocrProcessing ? "ring-4 ring-blue-400/40 border-blue-500 bg-blue-50/80" : ""}`;
  };

  const failureHint = (result: ProcessResult): string => {
    const err = (result.error || "").toLowerCase();
    if (err.includes("élève") || err.includes("eleve") || err.includes("identifi")) {
      return "Le nom ou prénom de l'élève n'a pas été reconnu clairement dans le document.";
    }
    if (err.includes("incomplet") || err.includes("filename")) {
      return "Le type de document ou les informations attendues (classe, date…) n'ont pas pu être lues.";
    }
    if (err.includes("ocr") || err.includes("texte")) {
      return "Le texte du PDF est illisible ou trop pauvre pour une analyse fiable.";
    }
    if (err.includes("déplacé") || err.includes("deplace") || err.includes("folder")) {
      return "Le dossier de destination n'a pas pu être créé ou atteint sur OneDrive.";
    }
    return "Le rangement automatique n'a pas abouti pour ce fichier.";
  };

  const failedResults = ocrResults.filter((r) => !r.success);

  const ProcessingSpinner = ({ size = "text-7xl" }: { size?: string }) => (
    <span
      className={`${size} inline-block animate-spin`}
      role="status"
      aria-label="Analyse en cours"
    >
      ⚙️
    </span>
  );

  return (
    <div className="p-6 max-w-[1200px] mx-auto mt-[1vh]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Ajout de documents IA
          </h1>
          <p className="text-gray-500 mt-1">
            Numérisez et rangez vos PDF dans les dossiers élèves sur OneDrive.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {oneDriveVerified && accessToken ? (
            <span className="px-4 py-2 bg-green-50 text-green-800 text-sm font-bold rounded-xl border border-green-200">
              OneDrive connecté
            </span>
          ) : null}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
          <p className="font-bold">Attention</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {clerkUser && !oneDriveProfile && (
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-r-xl">
          <p className="font-bold">Profil OneDrive non reconnu</p>
          <p className="text-sm">
            Votre compte Clerk ({clerkUser.lastName || "nom absent"} —{" "}
            {clerkUser.primaryEmailAddress?.emailAddress || "e-mail absent"}) n&apos;est pas encore associé au
            dossier collège / lycée / école. Contactez l&apos;administrateur pour l&apos;ajouter.
          </p>
        </div>
      )}

      {oneDriveProfile && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm">
          Dossier OneDrive configuré : <strong>{oneDriveProfile.label}</strong> —{" "}
          <span className="font-mono text-xs">{oneDriveProfile.basePath}</span>
        </div>
      )}

      <div
        className={`mb-8 rounded-3xl border p-5 md:p-6 ${
          dropsAvailable
            ? "border-green-200 bg-green-50/60"
            : "border-amber-200 bg-amber-50/80"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Étape 1 — Connexion
            </p>
            <h2 className="text-lg font-bold text-slate-900">
              {dropsAvailable ? "OneDrive est connecté" : "Connectez-vous à OneDrive"}
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              {dropsAvailable
                ? account?.name
                  ? `Compte : ${account.name}. Vous pouvez déposer vos PDF ci-dessous.`
                  : "Vous pouvez déposer vos PDF ci-dessous."
                : "La connexion Microsoft est obligatoire avant tout dépôt. Sans OneDrive, l'analyse et le rangement ne sont pas possibles."}
            </p>
          </div>
          {!dropsAvailable && (
            <button
              type="button"
              onClick={login}
              className="shrink-0 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Se connecter à OneDrive
            </button>
          )}
        </div>
      </div>

      <>
          {checkingOneDrive && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800 text-sm font-medium flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              Vérification de la connexion OneDrive…
            </div>
          )}
          {ocrProcessing && (
            <div className="mb-8 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-3xl shadow-xl flex flex-col items-center gap-4">
              <ProcessingSpinner size="text-8xl" />
              <p className="text-2xl font-extrabold text-blue-900 tracking-tight">
                Analyse en cours…
              </p>
              <p className="text-center text-sm font-medium text-blue-800 max-w-lg">
                L&apos;IA lit, découpe et range vos documents.{" "}
                <strong>Ne fermez pas cette page</strong> — cela peut prendre
                plusieurs minutes pour un export classe entière.
              </p>
              <div className="w-full max-w-lg">
                <div className="flex justify-between text-xs font-bold text-blue-700 mb-2 uppercase">
                  <span>Progression</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full bg-white/80 rounded-full h-4 overflow-hidden border border-blue-200">
                  <div
                    className="bg-blue-600 h-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Étape 2 — Dépôt des PDF
            </p>
            <p className="text-sm text-slate-600">
              {dropsAvailable
                ? "Choisissez la zone adaptée à vos fichiers."
                : "Les zones ci-dessous restent désactivées tant que OneDrive n'est pas connecté."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div
              id="ocr-drop-standard"
              onDragOver={
                dropDisabled
                  ? undefined
                  : (e) => {
                      e.preventDefault();
                      setIsDraggingStandard(true);
                    }
              }
              onDragLeave={() => setIsDraggingStandard(false)}
              onDrop={
                dropDisabled
                  ? undefined
                  : (e) => {
                      e.preventDefault();
                      setIsDraggingStandard(false);
                      if (e.dataTransfer.files?.length) {
                        enqueueStandard(e.dataTransfer.files);
                      }
                    }
              }
              onClick={() => !dropDisabled && standardInputRef.current?.click()}
              className={dropZoneClass(isDraggingStandard, "blue")}
            >
              <span className="inline-block mb-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black uppercase rounded-full">
                Standard
              </span>
              <div className="mb-3 min-h-[4rem] flex items-center justify-center">
                {ocrProcessing ? (
                  <ProcessingSpinner size="text-6xl" />
                ) : (
                  <span className="text-5xl">📄</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {!dropsAvailable
                  ? "Connexion OneDrive requise"
                  : checkingOneDrive
                    ? "Vérification OneDrive…"
                    : ocrProcessing
                      ? "Analyse en cours…"
                      : "Un PDF = un document"}
              </h3>
              <p className="text-sm text-gray-500">
                {!dropsAvailable
                  ? "Connectez-vous à l'étape 1 pour débloquer le dépôt de fichiers."
                  : checkingOneDrive
                    ? "Connexion Microsoft vérifiée avant tout traitement."
                    : ocrProcessing
                      ? "Traitement en cours — patientez."
                      : "Un fichier PDF par élève (bulletin, courrier…). Glissez-déposez ou cliquez pour choisir."}
              </p>
              <input
                ref={standardInputRef}
                type="file"
                className="hidden"
                multiple
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  if (e.target.files) {
                    enqueueStandard(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
            </div>

            <div
              onDragOver={
                dropDisabled
                  ? undefined
                  : (e) => {
                      e.preventDefault();
                      setIsDraggingClass(true);
                    }
              }
              onDragLeave={() => setIsDraggingClass(false)}
              onDrop={
                dropDisabled
                  ? undefined
                  : (e) => {
                      e.preventDefault();
                      setIsDraggingClass(false);
                      if (e.dataTransfer.files?.length) {
                        enqueueClass(e.dataTransfer.files);
                      }
                    }
              }
              onClick={() => !dropDisabled && classInputRef.current?.click()}
              className={dropZoneClass(isDraggingClass, "violet")}
            >
              <span className="inline-block mb-2 px-2 py-0.5 bg-violet-100 text-violet-800 text-[10px] font-black uppercase rounded-full">
                Expérimental
              </span>
              <div className="mb-3 min-h-[4rem] flex items-center justify-center">
                {ocrProcessing ? (
                  <ProcessingSpinner size="text-6xl" />
                ) : (
                  <span className="text-5xl">📚</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {!dropsAvailable
                  ? "Connexion OneDrive requise"
                  : checkingOneDrive
                    ? "Vérification OneDrive…"
                    : ocrProcessing
                      ? "Analyse en cours…"
                      : "Export classe entière"}
              </h3>
              <p className="text-sm text-gray-500">
                {!dropsAvailable
                  ? "Connectez-vous à l'étape 1 pour débloquer le dépôt de fichiers."
                  : checkingOneDrive
                    ? "Connexion Microsoft vérifiée avant tout traitement."
                    : ocrProcessing
                      ? "Découpe et rangement en cours…"
                      : "Un seul PDF multi-pages (export classe). L'outil découpe et range automatiquement par élève."}
              </p>
              <input
                ref={classInputRef}
                type="file"
                className="hidden"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    enqueueClass([e.target.files[0]]);
                    e.target.value = "";
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-8">
            <h4 className="font-bold text-gray-800 mb-4">📊 Session actuelle</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-2xl text-center">
                <span className="text-xs text-gray-600 block">Traités</span>
                <span className="font-black text-lg">
                  {processingStatus.completed + processingStatus.failed}
                </span>
              </div>
              <div className="p-3 bg-green-50 rounded-2xl text-center">
                <span className="text-xs text-green-700 block">Succès</span>
                <span className="font-black text-lg text-green-600">
                  {processingStatus.completed}
                </span>
              </div>
              <div className="p-3 bg-red-50 rounded-2xl text-center">
                <span className="text-xs text-red-700 block">Échecs</span>
                <span className="font-black text-lg text-red-600">
                  {processingStatus.failed}
                </span>
              </div>
            </div>
          </div>

          {failedResults.length > 0 && (
            <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-300 rounded-3xl shadow-lg">
              <h3 className="text-lg font-black text-amber-950 mb-2 flex items-center gap-2">
                <span>📁</span>
                {failedResults.length} document
                {failedResults.length > 1 ? "s" : ""} à traiter manuellement
              </h3>
              <div className="text-sm text-amber-950 mb-4 leading-relaxed space-y-3">
                <p>
                  Ces fichiers n&apos;ont <strong>pas pu être rangés automatiquement</strong> dans le dossier
                  d&apos;un élève. Ils se trouvent dans le dossier{" "}
                  <strong>Temp</strong>, à la <strong>racine de votre OneDrive</strong> (même niveau que
                  « Documents », « Images », etc.).
                </p>
                <p>
                  <strong>Pourquoi ?</strong> Le plus souvent : le nom de l&apos;élève n&apos;a pas été reconnu,
                  le type de document est ambigu, ou le texte du PDF est illisible.
                </p>
                <p>
                  <strong>Que faire ?</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Ouvrez OneDrive → dossier <strong>Temp</strong> → déplacez le PDF dans le bon dossier élève ;
                  </li>
                  <li>
                    ou repassez le fichier en mode <strong>Standard</strong> (« un PDF = un document ») si vous
                    l&apos;avez déjà séparé ;
                  </li>
                  <li>
                    n&apos;utilisez pas à nouveau le mode « Export classe » : la découpe a déjà eu lieu.
                  </li>
                </ul>
              </div>
              <ul className="space-y-3">
                {failedResults.map((r, index) => (
                  <li
                    key={index}
                    className="p-4 bg-white rounded-xl border border-amber-200"
                  >
                    <p className="font-bold text-slate-900">{r.fileName}</p>
                    <p className="text-sm text-slate-600 mt-1">{failureHint(r)}</p>
                    {r.tempOneDrivePath && (
                      <p className="text-sm text-slate-700 mt-2">
                        Emplacement OneDrive :{" "}
                        <span className="font-semibold">Temp / {r.tempOneDrivePath.replace(/^Temp\//, "")}</span>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ocrResults.length > 0 && (
            <div>
              <h3 className="text-xl font-black text-gray-900 mb-4">
                Journal d&apos;analyse
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {[...ocrResults]
                  .sort((a, b) =>
                    a.success === b.success ? 0 : a.success ? 1 : -1
                  )
                  .map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border ${
                        result.success
                          ? "bg-white border-gray-100"
                          : "bg-red-50 border-red-100 ring-2 ring-red-400/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className={`font-bold ${result.success ? "text-gray-800" : "text-red-700"}`}
                        >
                          {result.fileName}
                        </p>
                        {!result.success && (
                          <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black uppercase">
                            Temp → Standard ou manuel
                          </span>
                        )}
                      </div>
                      {result.success ? (
                        <p className="text-xs text-gray-500 mt-1">
                          Classé : {result.result?.fileName || "—"}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-red-600 mt-1 font-medium">
                            {failureHint(result)}
                          </p>
                          {result.tempOneDrivePath ? (
                            <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg">
                              Fichier dans OneDrive → dossier{" "}
                              <strong>Temp</strong> ({result.tempOneDrivePath.replace(/^Temp\//, "")})
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          <details className="mt-10 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden group">
            <summary className="cursor-pointer list-none px-6 py-4 font-bold text-slate-800 hover:bg-slate-50 flex items-center justify-between gap-2">
              <span>Configuration — liste élèves & dossiers OneDrive</span>
              <span className="text-slate-400 text-sm font-normal group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4">
              <p className="text-sm text-slate-600">
                {elevesCount != null
                  ? `${elevesCount} élève(s) enregistré(s) pour le classement automatique.`
                  : "Chargez la liste des élèves exportée depuis votre logiciel de scolarité (fichier JSON)."}
                {" "}
                La table des formations (MEF) se gère dans{" "}
                <a href="/parametres" className="text-indigo-600 font-medium hover:underline">
                  Paramètres
                </a>
                .
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={elevesUploading}
                  onClick={() => elevesInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-bold rounded-xl"
                >
                  {elevesUploading ? "Envoi…" : "Mettre à jour la liste élèves"}
                </button>
                <button
                  type="button"
                  disabled={!dropsAvailable || syncingFolders || checkingOneDrive}
                  onClick={handleSyncOneDriveFolders}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl"
                >
                  {syncingFolders ? "Synchronisation…" : "Créer les dossiers sur OneDrive"}
                </button>
                <button
                  type="button"
                  disabled={mefUploading}
                  onClick={() => mefInputRef.current?.click()}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-sm font-bold rounded-xl"
                >
                  {mefUploading ? "Envoi…" : "Importer table MEF (JSON)"}
                </button>
                <input
                  ref={elevesInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleElevesUpload(f);
                  }}
                />
                <input
                  ref={mefInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleMefUpload(f);
                  }}
                />
              </div>
              {elevesMessage && (
                <p
                  className={`text-sm ${elevesMessage.startsWith("Erreur") ? "text-red-600" : "text-green-700"}`}
                >
                  {elevesMessage}
                </p>
              )}
              {mefMessage && (
                <p className={`text-sm ${mefMessage.startsWith("Erreur") ? "text-red-600" : "text-slate-700"}`}>
                  {mefMessage}
                </p>
              )}
              {syncReport && (
                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 space-y-1">
                  <p>
                    <strong>{syncReport.secteurLabel}</strong> — {syncReport.basePath}
                  </p>
                  <p>
                    Dossiers créés : {syncReport.created} · Déjà existants : {syncReport.alreadyThere}
                  </p>
                </div>
              )}
            </div>
          </details>
      </>
    </div>
  );
}

export default function OneDriveUpDocsOCRAI() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Chargement…</div>}>
      <OneDriveUpDocsOCRAIContent />
    </Suspense>
  );
}

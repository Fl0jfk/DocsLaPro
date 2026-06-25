'use client';
import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import * as msal from "@azure/msal-browser";
import { buildTextFromPages } from "@/app/lib/eleves-config";
import { consumeDashboardUpload } from "@/app/lib/dashboard-upload-bridge";
import { getOneDriveProfileForClerkUser } from "@/app/lib/onedrive-user-profiles";
import ReplayModuleTourButton from "@/app/components/module-tour/ReplayModuleTourButton";

const ONEDRIVE_SCOPES = ["Files.ReadWrite", "User.Read"];

let msalInstance: msal.PublicClientApplication | null = null;

function getMsalInstance() {
  if (!msalInstance) throw new Error("MSAL non initialisé");
  return msalInstance;
}

function getMsalActiveAccount(): msal.AccountInfo | null {
  const instance = getMsalInstance();
  return instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null;
}

function setMsalActiveAccount(account: msal.AccountInfo | null) {
  if (account) getMsalInstance().setActiveAccount(account);
}

async function verifyOneDriveToken(token: string): Promise<boolean> {
  try {
    const verifyRes = await fetch("https://graph.microsoft.com/v1.0/me/drive?$select=id", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return verifyRes.ok;
  } catch {
    return false;
  }
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

const INITIAL_OCR_PROCESSING_STATUS = {
  percent: 0,
  total: 0,
  done: 0,
  completed: 0,
  failed: 0,
  totalKnown: false,
  label: "",
};

const BATCH_JOB_STORAGE_KEY = "agentIAOCR-active-batch-job";

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
  const [processingStatus, setProcessingStatus] = useState(INITIAL_OCR_PROCESSING_STATUS);
  const [ocrResultsSessionId, setOcrResultsSessionId] = useState(0);
  const [pendingStandardFiles, setPendingStandardFiles] = useState<File[]>([]);
  const [pendingClassFiles, setPendingClassFiles] = useState<File[]>([]);
  const [isDraggingStandard, setIsDraggingStandard] = useState(false);
  const [isDraggingClass, setIsDraggingClass] = useState(false);

  const [elevesCount, setElevesCount] = useState<number | null>(null);
  const [elevesSource, setElevesSource] = useState<"auto" | "pronote" | "ecoledirecte">("auto");
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
    createdFolders?: string[];
    extraFoldersCount?: number;
    extraFoldersOnOneDrive?: string[];
    ambiguousCount?: number;
    ambiguous?: Array<{ folderName: string; mef?: string; reason?: string }>;
    errors?: Array<{ folderName: string; error: string }>;
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
  const ocrSessionIdRef = useRef(0);
  const ocrAbortRef = useRef<AbortController | null>(null);
  const ocrProcessingRef = useRef(false);
  const processingLockRef = useRef(false);
  const [checkingOneDrive, setCheckingOneDrive] = useState(false);
  const [oneDriveVerified, setOneDriveVerified] = useState(false);
  const [activeBatchJobId, setActiveBatchJobId] = useState<string | null>(null);
  const [batchJobNeedsToken, setBatchJobNeedsToken] = useState(false);

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
      const activeAccount = getMsalActiveAccount();
      if (!activeAccount) {
        applyOneDriveSession(null, null);
        setError("Connectez-vous à OneDrive avant de déposer des fichiers (bouton en haut à droite).");
        return null;
      }
      setMsalActiveAccount(activeAccount);

      const cachedToken = oneDriveTokenRef.current;
      if (cachedToken && (await verifyOneDriveToken(cachedToken))) {
        applyOneDriveSession(activeAccount, cachedToken);
        setError("");
        return cachedToken;
      }

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
          setMsalActiveAccount(tokenResponse.account ?? activeAccount);
        } else {
          throw err;
        }
      }

      if (!(await verifyOneDriveToken(token))) {
        throw new Error("Session OneDrive expirée ou accès refusé. Reconnectez-vous.");
      }

      applyOneDriveSession(activeAccount, token);
      setError("");
      return token;
    } catch (err: unknown) {
      const account = getMsalActiveAccount();
      applyOneDriveSession(account, null);
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
          setMsalActiveAccount(accounts[0]);
          try {
            const tokenResponse = await getMsalInstance().acquireTokenSilent({
              account: accounts[0],
              scopes: ONEDRIVE_SCOPES,
            });
            if (await verifyOneDriveToken(tokenResponse.accessToken)) {
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
          setMsalActiveAccount(result.account);
          const tokenResponse = await getMsalInstance().acquireTokenSilent({
            account: result.account,
            scopes: ONEDRIVE_SCOPES,
          });
          if (await verifyOneDriveToken(tokenResponse.accessToken)) {
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

  useEffect(() => {
    ocrProcessingRef.current = ocrProcessing;
  }, [ocrProcessing]);

  const abortOcrInFlight = useCallback(() => {
    ocrAbortRef.current?.abort();
    ocrAbortRef.current = new AbortController();
  }, []);

  const isActiveOcrSession = useCallback((sessionId: number) => sessionId === ocrSessionIdRef.current, []);

  const resetOcrSessionUi = useCallback((clearResults: boolean) => {
    if (clearResults) setOcrResults([]);
    setError("");
    setProcessingStatus(INITIAL_OCR_PROCESSING_STATUS);
    if (standardInputRef.current) standardInputRef.current.value = "";
    if (classInputRef.current) classInputRef.current.value = "";
  }, []);

  const prepareOcrSessionForNewBatch = useCallback(() => {
    abortOcrInFlight();
    resetOcrSessionUi(true);
    setPendingStandardFiles([]);
    setPendingClassFiles([]);
  }, [abortOcrInFlight, resetOcrSessionUi]);

  const canAcceptNewOcrFiles = useCallback(() => {
    if (ocrProcessingRef.current || processingLockRef.current || activeBatchJobId) {
      setError(
        "Un traitement est encore en cours (sur le serveur). Attendez la fin ou consultez les échecs ci-dessous avant de déposer de nouveaux fichiers.",
      );
      return false;
    }
    return true;
  }, [activeBatchJobId]);

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
      setMsalActiveAccount(result.account);
      if (!(await verifyOneDriveToken(result.accessToken))) {
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

  const pollOcr = async (
    jobId: string,
    maxAttempts: number,
    signal: AbortSignal,
    onPoll?: (attempt: number, maxAttempts: number) => void,
  ): Promise<OcrData> => {
    for (let i = 0; i < maxAttempts; i++) {
      if (signal.aborted) {
        throw new DOMException("Session OCR interrompue.", "AbortError");
      }
      onPoll?.(i + 1, maxAttempts);
      const r = await fetch("/api/agentIAOCR/ocr-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
        signal,
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

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /** Pause entre fichiers : plus le lot est gros, plus on espace les appels Graph. */
  const interFileDelayMs = (processedCount: number, totalEstimate: number) => {
    const base = totalEstimate >= 100 ? 3500 : totalEstimate >= 50 ? 2800 : 2000;
    const extra = Math.floor(processedCount / 25) * 1500;
    return Math.min(12000, base + extra);
  };

  const parseRetryAfterMs = (res: Response, attempt: number): number => {
    const raw = res.headers.get("Retry-After");
    if (raw) {
      const sec = Number(raw);
      if (!Number.isNaN(sec) && sec > 0) return sec * 1000;
    }
    return Math.min(60_000, 4000 * 2 ** attempt);
  };

  const uploadToS3AndOneDrive = async (
    file: File,
    token: string,
    signal: AbortSignal,
  ): Promise<{ key: string; tempPath: string }> => {
    const r1 = await fetch("/api/agentIAOCR/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type || "application/pdf" }),
      signal,
    });
    if (!r1.ok) throw new Error(await r1.text());
    const { url, key } = await r1.json();
    const upload = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/pdf" },
      body: file,
      signal,
    });
    if (!upload.ok) throw new Error("Échec upload S3 : " + (await upload.text()));

    const tempPath = `Temp/${file.name}`;
    const putOneDrive = (accessToken: string) =>
      fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${tempPath}:/content`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": file.type || "application/pdf",
        },
        body: file,
        signal,
      });

    let activeToken = token;
    let odRes: Response | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      odRes = await putOneDrive(activeToken);
      if (odRes.status === 401) {
        const refreshed = await ensureOneDriveConnection();
        if (!refreshed) {
          throw new Error(
            "Session OneDrive expirée (401 Graph). Reconnectez-vous à Microsoft puis relancez les fichiers restants.",
          );
        }
        activeToken = refreshed;
        continue;
      }
      if (odRes.status === 429) {
        const waitMs = parseRetryAfterMs(odRes, attempt);
        await sleep(waitMs);
        continue;
      }
      break;
    }
    if (!odRes || !odRes.ok) {
      const detail = odRes ? await odRes.text() : "réponse vide";
      const status = odRes?.status ?? 0;
      const hint =
        status === 401
          ? "Session OneDrive expirée — reconnectez Microsoft."
          : status === 429
            ? "Limite de requêtes OneDrive atteinte — relancez les fichiers restants dans quelques minutes."
            : status >= 500
              ? "Service Microsoft Graph temporairement indisponible."
              : "";
      throw new Error(
        `Échec upload OneDrive Temp (${status})${hint ? ` — ${hint}` : ""} : ${detail.slice(0, 300)}`,
      );
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
    displayName: string,
    signal: AbortSignal,
  ): Promise<ProcessResult> => {
    try {
      const r4 = await fetch("/api/agentIAOCR/analyze-doc-match-eleve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal,
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
        signal,
      });
      if (moveRes.status === 401) {
        const refreshed = await ensureOneDriveConnection();
        if (refreshed) {
          const retry = await fetch("/api/agentIAOCR/move-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken: refreshed,
              sourcePath,
              targetFolderPath,
              newFileName,
            }),
            signal,
          });
          if (retry.ok) {
            return { success: true, result: ai, fileName: displayName };
          }
        }
      }
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

  const processSingleFile = async (file: File, signal: AbortSignal): Promise<ProcessResult> => {
    try {
      const token = await ensureOneDriveConnection();
      if (!token) throw new Error("Pas de token OneDrive disponible");
      const { key, tempPath } = await uploadToS3AndOneDrive(file, token, signal);
      const r2 = await fetch("/api/agentIAOCR/ocr-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
        signal,
      });
      if (!r2.ok) throw new Error(await r2.text());
      const { jobId } = await r2.json();
      if (!jobId) throw new Error("Impossible de lancer Textract");
      const ocr = await pollOcr(jobId, 30, signal);
      return await analyzeAndMove(token, ocr.text, tempPath, file.name, signal);
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

  const processClassFile = async (
    file: File,
    signal: AbortSignal,
    onStep?: (info: {
      results: ProcessResult[];
      label: string;
      percent: number;
      documentTotal?: number;
      pageCount?: number;
    }) => void,
  ): Promise<ProcessResult[]> => {
    const results: ProcessResult[] = [];
    const sourceTempPath = `Temp/${file.name}`;
    const report = (
      label: string,
      percent: number,
      extra?: { documentTotal?: number; pageCount?: number },
    ) => {
      if (signal.aborted) return;
      onStep?.({
        results: [...results],
        label,
        percent,
        documentTotal: extra?.documentTotal,
        pageCount: extra?.pageCount,
      });
    };
    try {
      const token = await ensureOneDriveConnection();
      if (!token) throw new Error("Pas de token OneDrive disponible");
      report(`Envoi de ${file.name}…`, 4);
      const { key } = await uploadToS3AndOneDrive(file, token, signal);

      report(`Lancement OCR de ${file.name}…`, 8);
      const r2 = await fetch("/api/agentIAOCR/ocr-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
        signal,
      });
      if (!r2.ok) throw new Error(await r2.text());
      const { jobId } = await r2.json();
      if (!jobId) throw new Error("Impossible de lancer Textract");

      const ocr = await pollOcr(jobId, 90, signal, (attempt, max) => {
        const pct = 8 + Math.round((38 * attempt) / max);
        report(
          `Lecture OCR (Textract) — tentative ${attempt}/${max}…`,
          pct,
        );
      });

      const pageCount = ocr.pageCount || 0;
      report(
        pageCount > 0
          ? `OCR terminé — ${pageCount} page${pageCount > 1 ? "s" : ""} lues`
          : `OCR terminé — analyse du découpage…`,
        48,
        { pageCount: pageCount || undefined },
      );

      report(`Découpage de ${file.name}…`, 52);
      const segRes = await fetch("/api/agentIAOCR/segment-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageTexts: ocr.pageTexts,
          pageCount: ocr.pageCount,
        }),
        signal,
      });
      if (!segRes.ok) throw new Error(await segRes.text());
      const segData = await segRes.json();
      const segments: Segment[] = segData.segments || [];
      const mode = segData.mode as string;
      const segPageCount =
        typeof segData.pageCount === "number" && segData.pageCount > 0
          ? segData.pageCount
          : pageCount;

      if (segPageCount > 0 && segments.length > 0) {
        const maxSegPage = Math.max(...segments.map((s) => s.pageEnd));
        if (maxSegPage < segPageCount) {
          console.warn(
            "[OCR] Segmentation incomplète:",
            maxSegPage,
            "/",
            segPageCount,
            "pages",
          );
        }
      }

      if (mode === "single" || segments.length <= 1) {
        const seg = segments[0] || { pageStart: 1, pageEnd: ocr.pageCount || 1 };
        const slice = buildTextFromPages(ocr.pageTexts, seg.pageStart, seg.pageEnd, ocr.text);
        report(`Classement de ${file.name}…`, 72, { documentTotal: 1 });
        const one = await analyzeAndMove(
          token,
          slice || ocr.text,
          sourceTempPath,
          file.name,
          signal,
        );
        results.push(one);
        report(`Terminé : ${file.name}`, 100, { documentTotal: 1 });
        return results;
      }

      const segmentTotal = segments.length;
      report(
        `Export classe — ${segmentTotal} document${segmentTotal > 1 ? "s" : ""} détecté${segmentTotal > 1 ? "s" : ""} (${pageCount} pages)`,
        56,
        { documentTotal: segmentTotal, pageCount: pageCount || undefined },
      );

      await deleteOneDrivePath(token, sourceTempPath);

      for (let i = 0; i < segments.length; i++) {
        if (signal.aborted) {
          throw new DOMException("Session OCR interrompue.", "AbortError");
        }
        const seg = segments[i];
        const label = `${file.name} [p.${seg.pageStart}-${seg.pageEnd}]`;
        const segmentPct =
          56 + Math.round((44 * i) / Math.max(segmentTotal, 1));
        report(
          `Segment ${i + 1} / ${segmentTotal} — ${label}`,
          segmentPct,
          { documentTotal: segmentTotal, pageCount: pageCount || undefined },
        );
        let tempSegPath: string | undefined;
        try {
          const segToken = (await ensureOneDriveConnection()) ?? token;
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
            report(
              `Segment ${i + 1} / ${segmentTotal} — texte vide`,
              56 + Math.round((44 * (i + 1)) / Math.max(segmentTotal, 1)),
              { documentTotal: segmentTotal, pageCount: pageCount || undefined },
            );
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
            signal,
          });
          if (!extractRes.ok) {
            throw new Error(await extractRes.text());
          }
          const { downloadUrl } = await extractRes.json();
          const pdfRes = await fetch(downloadUrl, { signal });
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
                Authorization: `Bearer ${segToken}`,
                "Content-Type": "application/pdf",
              },
              body: pdfBlob,
              signal,
            }
          );
          if (odPut.status === 401) {
            const refreshed = await ensureOneDriveConnection();
            if (!refreshed) {
              throw new Error(
                "Session OneDrive expirée (401) pendant le découpage — reconnectez Microsoft.",
              );
            }
            const retryPut = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/root:/${tempSegPath}:/content`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${refreshed}`,
                  "Content-Type": "application/pdf",
                },
                body: pdfBlob,
                signal,
              }
            );
            if (!retryPut.ok) {
              throw new Error("Upload segment OneDrive : " + (await retryPut.text()));
            }
          } else if (!odPut.ok) {
            throw new Error("Upload segment OneDrive : " + (await odPut.text()));
          }

          const moveToken = (await ensureOneDriveConnection()) ?? segToken;

          const r4 = await fetch("/api/agentIAOCR/analyze-doc-match-eleve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: slice }),
            signal,
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
            report(
              `Segment ${i + 1} / ${segmentTotal} — élève non identifié`,
              56 + Math.round((44 * (i + 1)) / Math.max(segmentTotal, 1)),
              { documentTotal: segmentTotal, pageCount: pageCount || undefined },
            );
            continue;
          }

          const segmentOdName = `${ai.fileName}.pdf`;

          const moveRes = await fetch("/api/agentIAOCR/move-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken: moveToken,
              sourcePath: tempSegPath,
              targetFolderPath: ai.oneDriveFolderPath,
              newFileName: segmentOdName,
            }),
            signal,
          });
          if (moveRes.status === 401) {
            const refreshed = await ensureOneDriveConnection();
            if (refreshed) {
              const retryMove = await fetch("/api/agentIAOCR/move-file", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  accessToken: refreshed,
                  sourcePath: tempSegPath,
                  targetFolderPath: ai.oneDriveFolderPath,
                  newFileName: segmentOdName,
                }),
                signal,
              });
              if (!retryMove.ok) {
                throw new Error(await retryMove.text());
              }
            } else {
              throw new Error("Session OneDrive expirée lors du rangement du segment.");
            }
          } else if (!moveRes.ok) {
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
        report(
          `Segment ${i + 1} / ${segmentTotal} traité`,
          56 + Math.round((44 * (i + 1)) / Math.max(segmentTotal, 1)),
          { documentTotal: segmentTotal, pageCount: pageCount || undefined },
        );
        await new Promise((r) => setTimeout(r, 800));
      }

      report(
        `Export classe terminé — ${segmentTotal} document${segmentTotal > 1 ? "s" : ""}`,
        100,
        { documentTotal: segmentTotal, pageCount: pageCount || undefined },
      );

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
    onProgress: (results: R[]) => void,
    onBetweenFiles?: (info: { processed: number; total: number; pauseMs: number }) => void | Promise<void>,
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processFn));
      results.push(...batchResults);
      onProgress(results);
      if (i + batchSize < items.length) {
        const processed = results.length;
        let pauseMs = interFileDelayMs(processed, items.length);
        if (processed > 0 && processed % 25 === 0) {
          pauseMs += 10_000;
        }
        await onBetweenFiles?.({ processed, total: items.length, pauseMs });
        await sleep(pauseMs);
      }
    }
    return results;
  }

  const applyProcessingProgress = (
    patch: {
      label: string;
      percent: number;
      done: number;
      total: number;
      totalKnown: boolean;
      completed: number;
      failed: number;
    },
    sessionId?: number,
  ) => {
    if (sessionId != null && !isActiveOcrSession(sessionId)) return;
    setProcessingStatus(patch);
  };

  const mergeClassProgress = (
    allResults: ProcessResult[],
    classBase: number,
    info: {
      results: ProcessResult[];
      label: string;
      percent: number;
      documentTotal?: number;
      pageCount?: number;
    },
    stdShare: number,
    classShare: number,
    sessionId: number,
  ) => {
    const merged = [...allResults, ...info.results];
    const completed = merged.filter((r) => r.success).length;
    const failed = merged.filter((r) => !r.success).length;
    const done = completed + failed;
    const overallPercent = Math.min(
      100,
      Math.round(stdShare * 100 + classShare * info.percent),
    );
    const totalKnown = info.documentTotal != null;
    const total = totalKnown ? classBase + (info.documentTotal ?? 0) : 0;

    applyProcessingProgress({
      percent: overallPercent,
      label: info.label,
      done: totalKnown ? classBase + info.results.length : done,
      total: totalKnown ? total : 0,
      totalKnown,
      completed,
      failed,
    }, sessionId);
  };

  const resumeBatchWithOneDrive = useCallback(async () => {
    if (!activeBatchJobId) return;
    const token = await ensureOneDriveConnection();
    if (!token) return;
    const res = await fetch("/api/agentIAOCR/batch-job/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: activeBatchJobId, accessToken: token }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setBatchJobNeedsToken(false);
    setError("");
  }, [activeBatchJobId, ensureOneDriveConnection]);

  useEffect(() => {
    if (!clerkUser?.id) return;
    void (async () => {
      try {
        const listRes = await fetch("/api/agentIAOCR/batch-job/list");
        if (!listRes.ok) return;
        const listData = await listRes.json();
        const active = (listData.jobs as Array<{ jobId: string; status: string }> | undefined)?.find(
          (j) => j.status === "pending" || j.status === "processing" || j.status === "needs_token",
        );
        const stored = localStorage.getItem(BATCH_JOB_STORAGE_KEY);
        const jobId = active?.jobId || stored;
        if (!jobId) return;

        const stRes = await fetch(
          `/api/agentIAOCR/batch-job/status?jobId=${encodeURIComponent(jobId)}`,
        );
        if (stRes.ok) {
          const st = await stRes.json();
          if (st.status === "completed" || st.status === "failed") {
            localStorage.removeItem(BATCH_JOB_STORAGE_KEY);
            if (Array.isArray(st.results)) setOcrResults(st.results);
            setProcessingStatus({
              percent: st.status === "completed" ? 100 : st.percent ?? 0,
              label: st.label || "",
              done: st.currentItemIndex ?? 0,
              total: st.totalItems ?? 0,
              totalKnown: true,
              completed: st.completed ?? 0,
              failed: st.failed ?? 0,
            });
            if (st.status === "failed" && st.error) setError(String(st.error));
            return;
          }
        }

        setActiveBatchJobId(jobId);
        setOcrProcessing(true);
        if (active?.status === "needs_token") setBatchJobNeedsToken(true);
      } catch {
        /* ignore */
      }
    })();
  }, [clerkUser?.id]);

  useEffect(() => {
    if (!activeBatchJobId || batchJobNeedsToken) return;
    let cancelled = false;
    let polls = 0;

    const tick = async () => {
      if (cancelled) return;
      try {
        if (polls > 0) await sleep(polls < 3 ? 2000 : 4000);
        polls += 1;

        if (polls % 5 === 0) {
          const fresh = await ensureOneDriveConnection();
          if (fresh) {
            await fetch("/api/agentIAOCR/batch-job/token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jobId: activeBatchJobId,
                accessToken: fresh,
                refreshOnly: true,
              }),
            });
          }
        }

        await fetch("/api/agentIAOCR/batch-job/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: activeBatchJobId }),
        });

        const stRes = await fetch(
          `/api/agentIAOCR/batch-job/status?jobId=${encodeURIComponent(activeBatchJobId)}`,
        );
        if (!stRes.ok || cancelled) return;
        const st = await stRes.json();

        setProcessingStatus({
          percent: typeof st.percent === "number" ? st.percent : 0,
          label: st.label || "Traitement serveur en cours…",
          done: typeof st.currentItemIndex === "number" ? st.currentItemIndex : 0,
          total: typeof st.totalItems === "number" ? st.totalItems : 0,
          totalKnown: true,
          completed: typeof st.completed === "number" ? st.completed : 0,
          failed: typeof st.failed === "number" ? st.failed : 0,
        });
        if (Array.isArray(st.results)) {
          setOcrResults(st.results);
          setOcrResultsSessionId((id) => id + 1);
        }

        if (st.status === "needs_token") {
          setBatchJobNeedsToken(true);
          setOcrProcessing(true);
          return;
        }

        if (st.status === "completed" || st.status === "failed") {
          setOcrProcessing(false);
          setActiveBatchJobId(null);
          localStorage.removeItem(BATCH_JOB_STORAGE_KEY);
          if (st.status === "failed" && st.error) setError(String(st.error));
          return;
        }

        void tick();
      } catch (e) {
        if (!cancelled) console.warn("[agentIAOCR] poll batch:", e);
      }
    };

    void tick();
    return () => {
      cancelled = true;
    };
  }, [activeBatchJobId, batchJobNeedsToken, ensureOneDriveConnection]);

  const runProcessing = async (
    standardFiles: File[],
    classFiles: File[],
  ) => {
    const token = await ensureOneDriveConnection();
    if (!token) return;

    abortOcrInFlight();
    const sessionId = ocrSessionIdRef.current + 1;
    ocrSessionIdRef.current = sessionId;
    const signal = ocrAbortRef.current!.signal;

    setOcrProcessing(true);
    setError("");
    setOcrResults([]);
    setBatchJobNeedsToken(false);
    setActiveBatchJobId(null);

    const allEntries: { file: File; mode: "standard" | "class" }[] = [
      ...standardFiles.map((file) => ({ file, mode: "standard" as const })),
      ...classFiles.map((file) => ({ file, mode: "class" as const })),
    ];

    applyProcessingProgress(
      {
        percent: 1,
        label: "Envoi des fichiers vers S3 et OneDrive…",
        done: 0,
        total: allEntries.length,
        totalKnown: true,
        completed: 0,
        failed: 0,
      },
      sessionId,
    );

    try {
      const items: Array<{
        fileName: string;
        mode: "standard" | "class";
        s3Key: string;
        tempPath: string;
      }> = [];

      let uploadToken = token;

      for (let i = 0; i < allEntries.length; i++) {
        if (!isActiveOcrSession(sessionId)) return;
        if (i > 0 && i % 25 === 0) {
          const refreshed = await ensureOneDriveConnection();
          if (refreshed) uploadToken = refreshed;
        }
        const { file, mode } = allEntries[i];
        applyProcessingProgress(
          {
            percent: Math.max(2, Math.round((32 * (i + 1)) / allEntries.length)),
            label: `Upload ${i + 1} / ${allEntries.length} — ${file.name}`,
            done: i,
            total: allEntries.length,
            totalKnown: true,
            completed: 0,
            failed: 0,
          },
          sessionId,
        );
        const { key, tempPath } = await uploadToS3AndOneDrive(file, uploadToken, signal);
        items.push({ fileName: file.name, mode, s3Key: key, tempPath });
      }

      if (!isActiveOcrSession(sessionId)) return;

      const freshToken = (await ensureOneDriveConnection()) ?? uploadToken;

      applyProcessingProgress(
        {
          percent: 36,
          label: "Lancement du traitement sur le serveur…",
          done: allEntries.length,
          total: allEntries.length,
          totalKnown: true,
          completed: 0,
          failed: 0,
        },
        sessionId,
      );

      const createRes = await fetch("/api/agentIAOCR/batch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: freshToken, items }),
        signal,
      });
      if (!createRes.ok) throw new Error(await createRes.text());
      const created = await createRes.json();
      const jobId = created.jobId as string | undefined;
      if (!jobId) throw new Error("Impossible de créer le traitement serveur");

      localStorage.setItem(BATCH_JOB_STORAGE_KEY, jobId);
      setActiveBatchJobId(jobId);
      applyProcessingProgress(
        {
          percent: 40,
          label: `Traitement serveur lancé (${items.length} PDF) — vous pouvez quitter cette page`,
          done: 0,
          total: items.length,
          totalKnown: true,
          completed: 0,
          failed: 0,
        },
        sessionId,
      );
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!isActiveOcrSession(sessionId)) return;
      setOcrProcessing(false);
      setError(
        "Erreur lors de l'envoi ou du lancement : " +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      if (isActiveOcrSession(sessionId)) {
        if (standardInputRef.current) standardInputRef.current.value = "";
        if (classInputRef.current) classInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    const hasWork =
      pendingStandardFiles.length > 0 || pendingClassFiles.length > 0;
    if (!hasWork || ocrProcessing || processingLockRef.current || !msalReady) return;

    processingLockRef.current = true;
    const standard = [...pendingStandardFiles];
    const classF = [...pendingClassFiles];
    setPendingStandardFiles([]);
    setPendingClassFiles([]);

    void runProcessing(standard, classF).finally(() => {
      processingLockRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pendingStandardFiles,
    pendingClassFiles,
    ocrProcessing,
    msalReady,
  ]);

  const enqueueOcrFiles = (
    fileList: FileList | File[],
    mode: "standard" | "class",
  ) => {
    const pdfs = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf"),
    );
    if (pdfs.length === 0) {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (!canAcceptNewOcrFiles()) return;

    const hasPending = pendingStandardFiles.length > 0 || pendingClassFiles.length > 0;
    const hasPriorSession =
      !hasPending &&
      (ocrResults.length > 0 ||
        processingStatus.done > 0 ||
        processingStatus.percent >= 100);

    if (hasPriorSession) {
      prepareOcrSessionForNewBatch();
    }

    if (mode === "standard") {
      setPendingStandardFiles((prev) => [...prev, ...pdfs]);
    } else {
      if (pdfs.length !== Array.from(fileList).length) {
        setError("Seuls les fichiers PDF sont acceptés.");
      }
      setPendingClassFiles((prev) => [...prev, ...pdfs]);
    }
  };

  const enqueueStandard = async (fileList: FileList | File[]) => {
    if (!oneDriveVerified || !oneDriveTokenRef.current) {
      const token = await ensureOneDriveConnection();
      if (!token) return;
    }
    enqueueOcrFiles(fileList, "standard");
  };

  const enqueueClass = async (fileList: FileList | File[]) => {
    if (!oneDriveVerified || !oneDriveTokenRef.current) {
      const token = await ensureOneDriveConnection();
      if (!token) return;
    }
    enqueueOcrFiles(fileList, "class");
  };

  const handleStartFreshOcrSession = () => {
    if (ocrProcessingRef.current || processingLockRef.current) return;
    abortOcrInFlight();
    ocrSessionIdRef.current += 1;
    resetOcrSessionUi(true);
    setPendingStandardFiles([]);
    setPendingClassFiles([]);
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
      const fd = new FormData();
      fd.append("file", file);
      fd.append("source", elevesSource);
      const res = await fetch("/api/eleves/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la mise à jour");
      setElevesCount(data.count);
      const src =
        data.detectedSource === "pronote"
          ? " (Pronote)"
          : data.detectedSource === "ecoledirecte"
            ? " (École Directe)"
            : "";
      setElevesMessage(
        (data.message || `Liste mise à jour (${data.count} élèves).`) +
          src +
          " — Pensez à synchroniser les dossiers OneDrive.",
      );
    } catch (e: unknown) {
      setElevesMessage(
        "Erreur : " + (e instanceof Error ? e.message : String(e)),
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
  const dropDisabled = !dropsAvailable || ocrProcessing || checkingOneDrive || processingLockRef.current;
  const canStartFreshSession =
    !ocrProcessing &&
    !processingLockRef.current &&
    (ocrResults.length > 0 || processingStatus.done > 0 || processingStatus.percent >= 100);
  const progressPercent = processingStatus.percent;
  const progressCaption = processingStatus.totalKnown
    ? `${processingStatus.done} / ${processingStatus.total} document${processingStatus.total > 1 ? "s" : ""}`
    : "";

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

      {batchJobNeedsToken && activeBatchJobId && (
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-r-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-bold">Session OneDrive expirée</p>
            <p className="text-sm">
              Le traitement serveur est en pause. Reconnectez Microsoft pour reprendre le rangement des fichiers restants.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void resumeBatchWithOneDrive()}
            className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
          >
            Reconnecter et reprendre
          </button>
        </div>
      )}

      {activeBatchJobId && ocrProcessing && !batchJobNeedsToken && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-sm">
          Traitement en cours sur le <strong>serveur</strong> — vous pouvez fermer cet onglet ou éteindre votre poste.
          Revenez plus tard sur cette page pour suivre la progression.
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
        data-tour="onedrive-connect"
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
                  <span>
                    {progressCaption ? `${progressCaption} · ` : ""}
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <div className="w-full bg-white/80 rounded-full h-4 overflow-hidden border border-blue-200">
                  <div
                    className="bg-blue-600 h-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                  />
                </div>
                {processingStatus.label ? (
                  <p className="mt-3 text-center text-sm font-semibold text-blue-900/90 animate-pulse">
                    {processingStatus.label}
                  </p>
                ) : null}
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
              data-tour="drop-standard"
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
              data-tour="drop-class"
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
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h4 className="font-bold text-gray-800">📊 Session actuelle</h4>
              {canStartFreshSession ? (
                <button
                  type="button"
                  onClick={handleStartFreshOcrSession}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-bold hover:bg-slate-100"
                >
                  Nouvelle session
                </button>
              ) : null}
            </div>
            {canStartFreshSession ? (
              <p className="text-xs text-slate-500 mb-4">
                Les résultats ci-dessous restent visibles jusqu&apos;au prochain dépôt. Utilisez « Nouvelle session » pour
                effacer l&apos;écran sans recharger la page.
              </p>
            ) : null}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-2xl text-center">
                <span className="text-xs text-gray-600 block">Traités</span>
                <span className="font-black text-lg">
                  {processingStatus.totalKnown ? (
                    <>
                      {processingStatus.done}
                      <span className="text-sm font-bold text-gray-400">
                        {" "}
                        / {processingStatus.total}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-gray-400">—</span>
                  )}
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
                    key={`${ocrResultsSessionId}-fail-${r.fileName}-${index}`}
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
                      key={`${ocrResultsSessionId}-${result.fileName}-${index}`}
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

          <details
            data-tour="eleves-import"
            className="mt-10 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden group"
          >
            <summary className="cursor-pointer list-none px-6 py-4 font-bold text-slate-800 hover:bg-slate-50 flex items-center justify-between gap-2">
              <span>Configuration — liste élèves & dossiers OneDrive</span>
              <span className="text-slate-400 text-sm font-normal group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-6">
              <p className="text-sm text-slate-600">
                Trois actions dans l&apos;ordre : importer la liste élèves, configurer la table MEF, puis créer les
                dossiers OneDrive manquants.
                {elevesCount != null && (
                  <span className="block mt-1 font-medium text-slate-800">
                    {elevesCount} élève(s) actuellement enregistré(s) pour le classement automatique.
                  </span>
                )}
              </p>

              <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">1 — Importer la liste élèves (Excel)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enregistre les élèves utilisés par l&apos;IA pour reconnaître et classer les documents. À refaire
                  quand la liste change (rentrée, arrivées…). L&apos;import{" "}
                  <strong>fusionne toujours</strong> avec la liste déjà enregistrée : élèves reconnus (INE ou nom +
                  prénom) mis à jour (classe, MEF, e-mails), nouveaux ajoutés, les autres conservés sans suppression.
                </p>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950 leading-relaxed space-y-2">
                  <p className="font-bold">
                    Ligne d&apos;en-tête obligatoire : la 1re ligne du fichier doit contenir les titres des
                    colonnes. Sans elle, l&apos;import échoue.
                  </p>
                  <p className="font-semibold text-amber-900">Ordre des colonnes (de gauche à droite) :</p>
                  <ol className="list-decimal list-inside space-y-0.5 pl-1">
                    <li>Nom</li>
                    <li>Prénom</li>
                    <li>Classe (ou Division)</li>
                    <li>INE / identifiant national</li>
                    <li>Code MEF / Formation</li>
                    <li>E-mail élève (optionnel)</li>
                    <li>E-mail parent (optionnel)</li>
                  </ol>
                  <p className="text-amber-800">
                    Pronote : Scolarité → Exports → liste élèves Excel. École Directe : export modulable — placez les
                    colonnes dans cet ordre. Le JSON reste possible pour les cas avancés.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-semibold text-slate-600">
                    Source export
                    <select
                      className="ml-2 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      value={elevesSource}
                      onChange={(e) =>
                        setElevesSource(e.target.value as "auto" | "pronote" | "ecoledirecte")
                      }
                    >
                      <option value="auto">Détection auto</option>
                      <option value="pronote">Pronote</option>
                      <option value="ecoledirecte">École Directe</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={elevesUploading}
                    onClick={() => elevesInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-bold rounded-xl"
                  >
                    {elevesUploading ? "Envoi…" : "Importer liste élèves (Excel)"}
                  </button>
                </div>
                {elevesMessage && (
                  <p
                    className={`text-sm ${elevesMessage.startsWith("Erreur") ? "text-red-600" : "text-green-700"}`}
                  >
                    {elevesMessage}
                  </p>
                )}
              </section>

              <section
                data-tour="mef-table"
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
              >
                <h3 className="text-sm font-bold text-slate-800">2 — Table des formations (MEF)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Associe chaque <strong>code ou libellé MEF</strong> (colonne E de l&apos;Excel : 3EME, 2NDE,
                  Cycle 2…) au secteur <strong>Lycée</strong>, <strong>Collège</strong> ou{" "}
                  <strong>École</strong>. Cela permet à chaque secrétariat de ne traiter que ses élèves et de
                  créer les bons dossiers OneDrive.
                </p>
                <p className="text-xs text-slate-500">
                  Configuration habituelle :{" "}
                  <a href="/parametres" className="text-indigo-600 font-medium hover:underline">
                    Paramètres → Formations MEF
                  </a>{" "}
                  (une fois par an ou si les formations changent). Le bouton ci-dessous est un raccourci pour
                  importer un fichier JSON déjà préparé.
                </p>
                {mefCounts && mefCounts.total > 0 && (
                  <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                    Table MEF active : {mefCounts.total} formation(s) — lycée {mefCounts.lycee}, collège{" "}
                    {mefCounts.college}, école {mefCounts.ecole}.
                  </p>
                )}
                <div>
                  <button
                    type="button"
                    disabled={mefUploading}
                    onClick={() => mefInputRef.current?.click()}
                    className="px-4 py-2 border border-slate-300 hover:bg-white disabled:opacity-50 text-slate-700 text-sm font-bold rounded-xl bg-white"
                  >
                    {mefUploading ? "Envoi…" : "Importer table MEF (JSON)"}
                  </button>
                </div>
                {mefMessage && (
                  <p className={`text-sm ${mefMessage.startsWith("Erreur") ? "text-red-600" : "text-slate-700"}`}>
                    {mefMessage}
                  </p>
                )}
              </section>

              <section
                data-tour="sync-onedrive"
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
              >
                <h3 className="text-sm font-bold text-slate-800">3 — Créer les dossiers sur OneDrive</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Crée un dossier par élève de <strong>votre secteur</strong> (format « NOM Prenom » — sans
                  tirets, sans classe)
                  dans l&apos;arborescence OneDrive connectée en haut de page.
                </p>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-950 leading-relaxed space-y-1">
                  <p className="font-bold">Sans risque pour les dossiers existants</p>
                  <p>
                    Ce bouton <strong>ne supprime ni ne renomme rien</strong>. Il ajoute uniquement les dossiers
                    manquants pour les élèves de la liste actuelle. Les dossiers déjà là sont laissés tels quels.
                  </p>
                  <p>
                    Il est normal d&apos;avoir <strong>plus de dossiers sur OneDrive</strong> que d&apos;élèves dans
                    la liste : les anciens élèves partis restent archivés sur OneDrive et ne sont{" "}
                    <strong>jamais supprimés</strong> par cette action.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    disabled={!dropsAvailable || syncingFolders || checkingOneDrive}
                    onClick={handleSyncOneDriveFolders}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl"
                  >
                    {syncingFolders ? "Synchronisation…" : "Créer les dossiers sur OneDrive"}
                  </button>
                  {!dropsAvailable && (
                    <p className="mt-2 text-xs text-amber-700">
                      Connectez OneDrive en haut de page pour activer ce bouton.
                    </p>
                  )}
                </div>
                {syncReport && (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 space-y-3">
                    <div>
                      <p className="font-bold text-slate-900">
                        {syncReport.secteurLabel} — {syncReport.basePath}
                      </p>
                      <p className="text-slate-600 mt-1">{syncReport.message}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                        <p className="font-bold text-emerald-900">{syncReport.created ?? 0}</p>
                        <p className="text-emerald-800">créé(s)</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                        <p className="font-bold text-slate-800">{syncReport.alreadyThere ?? 0}</p>
                        <p className="text-slate-600">déjà présent(s)</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                        <p className="font-bold text-amber-900">{syncReport.extraFoldersCount ?? 0}</p>
                        <p className="text-amber-800">archives OneDrive</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                        <p className="font-bold text-slate-800">{syncReport.jsonForYourSecteur ?? "—"}</p>
                        <p className="text-slate-600">élèves secteur</p>
                      </div>
                    </div>

                    {(syncReport.createdFolders?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-800 mb-1">
                          Dossiers créés ({syncReport.createdFolders!.length})
                        </p>
                        <ul className="max-h-48 overflow-y-auto rounded-lg border border-emerald-100 bg-emerald-50/50 text-xs font-mono divide-y divide-emerald-100">
                          {syncReport.createdFolders!.map((name) => (
                            <li key={name} className="px-3 py-1.5 text-emerald-950">
                              {name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(syncReport.created ?? 0) === 0 && (syncReport.alreadyThere ?? 0) > 0 && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Tous les élèves de la liste avaient déjà leur dossier — rien à ajouter, c&apos;est normal.
                      </p>
                    )}

                    {(syncReport.extraFoldersCount ?? 0) > 0 && (
                      <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                        <strong>{syncReport.extraFoldersCount} dossier(s)</strong> sur OneDrive ne correspondent plus
                        à un élève de la liste actuelle (anciens élèves, archives…). Ils ont été{" "}
                        <strong>laissés en place</strong> — cette action ne les supprime pas.
                      </p>
                    )}

                    {(syncReport.ambiguousCount ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-bold text-amber-800 mb-1">
                          Non traités — MEF manquant ou inconnu ({syncReport.ambiguousCount})
                        </p>
                        <ul className="max-h-32 overflow-y-auto text-xs text-amber-900 space-y-0.5">
                          {syncReport.ambiguous?.map((a) => (
                            <li key={a.folderName}>
                              {a.folderName}
                              {a.mef ? ` (${a.mef})` : ""} — {a.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(syncReport.errors?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-bold text-red-700 mb-1">Erreurs</p>
                        <ul className="text-xs text-red-600 space-y-0.5">
                          {syncReport.errors!.map((e) => (
                            <li key={e.folderName}>
                              {e.folderName} — {e.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <input
                ref={elevesInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleElevesUpload(f);
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
          </details>
          <ReplayModuleTourButton moduleId="agent-ia-ocr" />
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

'use client';
import { useState, useEffect, useRef } from "react";
import * as msal from "@azure/msal-browser";

const msalConfig: msal.Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_TENANT_ID}`,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}agentIAOCR`,
  }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

export default function OneDriveUpDocsOCRAI() {
  const [account, setAccount] = useState<msal.AccountInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [files, setFiles] = useState<any[]>([]);
  console.log(files)
  const [error, setError] = useState("");
  const [msalReady, setMsalReady] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("");
  const [ocrProcessing, setOcrProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ocrResults, setOcrResults] = useState<any[]>([]);
  const [processingStatus, setProcessingStatus] = useState<{ total: number; completed: number; failed: number; }>({ total: 0, completed: 0, failed: 0 });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const multiInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const init = async () => {
      try {
        await msalInstance.initialize();
        setMsalReady(true);
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const tokenResponse = await msalInstance.acquireTokenSilent({ account: accounts[0], scopes: ["Files.ReadWrite", "User.Read"] });
          setAccessToken(tokenResponse.accessToken);
          await fetchFiles(tokenResponse.accessToken, null, "");
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError("Erreur init MSAL: " + err.message);
      }
    };
    init();
  }, []);
  useEffect(() => {
    if (!msalReady) return;
    const handleRedirect = async () => {
      try {
        const result = await msalInstance.handleRedirectPromise();
        if (result?.account) {
          setAccount(result.account);
          const tokenResponse = await msalInstance.acquireTokenSilent({ account: result.account, scopes: ["Files.ReadWrite", "User.Read"] });
          setAccessToken(tokenResponse.accessToken);
          await fetchFiles(tokenResponse.accessToken, null, "");
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError("Erreur login redirect: " + err.message);
      }
    };
    handleRedirect();
  }, [msalReady]);
  const login = async () => {
    if (!msalReady) {
      setError("MSAL n'est pas encore initialisé.");
      return;
    }
    try {
      await msalInstance.loginRedirect({ scopes: ["Files.ReadWrite", "User.Read"] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError("Erreur login: " + err.message);
    }
  };
  const fetchFiles = async (
    token: string,
    folderId: string | null,
    folderPath: string
  ) => {
    try {
      const url = folderId ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children` : folderPath ? `https://graph.microsoft.com/v1.0/me/drive/root:/${folderPath}:/children` : "https://graph.microsoft.com/v1.0/me/drive/root/children";
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFiles(data.value || []);
      setCurrentFolder(folderId);
      setCurrentFolderPath(folderPath);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError("Erreur Graph API: " + err.message);
    }
  };
  async function processInBatches<T, R>(items: T[], batchSize: number, processFn: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processFn));
      results.push(...batchResults);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentCompleted = results.filter((r: any) => r.success).length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentFailed = results.filter((r: any) => !r.success).length;
      setProcessingStatus((prev) => ({ total: prev.total, completed: currentCompleted, failed: currentFailed }));
      if (i + batchSize < items.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    return results;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processSingleFile = async (file: File): Promise<{ success: boolean; result?: any; error?: string; fileName: string }> => {
    try {
      if (!accessToken) { throw new Error("Pas de token OneDrive disponible")}
      const r1 = await fetch("/api/agentIAOCR/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
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
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": file.type || "application/pdf",
          },
          body: file,
        }
      );
      if (!odRes.ok) { throw new Error("Échec upload OneDrive Temp : " + (await odRes.text()))}
      const r2 = await fetch("/api/agentIAOCR/ocr-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!r2.ok) throw new Error(await r2.text());
      const { jobId } = await r2.json();
      if (!jobId) throw new Error("Impossible de lancer Textract");
      let extractedText = "";
      for (let i = 0; i < 30; i++) {
        const r3 = await fetch("/api/agentIAOCR/ocr-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });
        if (!r3.ok) throw new Error(await r3.text());
        const data = await r3.json();
        if (data.text) {
          extractedText = data.text;
          break;
        }
        if (data.status === "IN_PROGRESS") {
          await new Promise((r) => setTimeout(r, 5000));
        } else {
          throw new Error("OCR Textract a échoué : " + JSON.stringify(data));
        }
      }
      if (!extractedText) throw new Error("Timeout OCR : aucun texte retourné");
      const r4 = await fetch("/api/agentIAOCR/analyze-doc-match-eleve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });
      if (!r4.ok) throw new Error(await r4.text());
      const ai = await r4.json();
      if (ai?.fileName) {
        const newFileName = `${ai.fileName}.pdf`;
        const sourcePath = `Temp/${file.name}`;
        const targetFolderPath = ai.oneDriveFolderPath || null;
        if (!targetFolderPath) { return { success: false, error: "Aucun élève trouvé de manière fiable, veuillez ranger ce document manuellement.", fileName: file.name, result: ai } }
        const moveRes = await fetch("/api/agentIAOCR/move-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,
            sourcePath,
            targetFolderPath,
            newFileName,
          }),
        });
        if (!moveRes.ok) { throw new Error("Erreur le fichier n'a pas pu être déplacé, aucun dossier élèves ne correspond.: " + (await moveRes.text()))}
      }
      return { success: true, result: ai, fileName: file.name };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      return { success: false, error: err.message, fileName: file.name };
    }
  };
  const enqueueFiles = (fileList: FileList | File[]) => {
    if (!msalReady || !account || !accessToken) {
      setError("Vous devez être connecté à OneDrive avant d'envoyer des fichiers.");
      return;
    }
    const arr = Array.from(fileList);
    setPendingFiles((prev) => [...prev, ...arr]);
  };
  const processQueue = async () => {
    if (ocrProcessing) return;
    if (pendingFiles.length === 0) return;
    if (!msalReady || !account || !accessToken) return;
    const filesToProcess = pendingFiles;
    setPendingFiles([]);
    setOcrProcessing(true);
    setError("");
    setOcrResults([]);
    setProcessingStatus({ total: filesToProcess.length, completed: 0, failed: 0 });
    try {
      const results = await processInBatches(filesToProcess, 2, processSingleFile);
      const completed = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      setProcessingStatus({ total: filesToProcess.length, completed, failed });
      setOcrResults(results);
      await fetchFiles(accessToken, currentFolder, currentFolderPath);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError("Erreur globale OCR / Analyse: " + err.message);
    } finally {
      setOcrProcessing(false);
      if (multiInputRef.current) { multiInputRef.current.value = "" }
    }
  };
  useEffect(() => {
    if (!ocrProcessing && pendingFiles.length > 0 && msalReady && account && accessToken) {
      processQueue();
    }
  }, [pendingFiles, ocrProcessing, msalReady, account, accessToken]);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { enqueueFiles(e.dataTransfer.files); }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
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
  const dropDisabled = !account || !accessToken || ocrProcessing;
  const progressPercent = processingStatus.total > 0  ? ((processingStatus.completed + processingStatus.failed) / processingStatus.total) * 100  : 0;
  return (
    <div className="p-6 max-w-[1200px] mx-auto mt-[8vh]">
      <div className="flex flex-col md:max-lg:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">IA Scanner & OneDrive</h1>
          <p className="text-gray-500">Automatisez le rangement de vos documents par élève.</p>
        </div>
        {!account && (
          <button onClick={login} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2">
            <span>🔌</span> Se connecter à OneDrive
          </button>
        )}
      </div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm">
          <p className="font-bold">Attention</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {account && (
        <>
          <div className="grid grid-cols-1 gap-8">
            <div
              onDragOver={dropDisabled ? undefined : handleDragOver}
              onDragLeave={dropDisabled ? undefined : handleDragLeave}
              onDrop={dropDisabled ? undefined : handleDrop}
              onClick={() => !dropDisabled && multiInputRef.current?.click()}
              className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 group
                ${isDragging ? "border-blue-600 bg-blue-50 scale-[1.01]" : "border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50"}
                ${dropDisabled ? "opacity-60 cursor-not-allowed shadow-none" : "cursor-pointer shadow-xl hover:shadow-2xl"}`}
            >
              <div className="flex flex-col items-center">
                <div className={`text-6xl mb-4 transition-all duration-500 ${ocrProcessing ? 'scale-110' : 'group-hover:rotate-12'}`}>
                  {ocrProcessing ? <div className="animate-spin inline-block">⚙️</div> : "📄"}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {ocrProcessing ? "Analyse en cours..." : "Glissez vos documents PDF ici"}
                </h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  {ocrProcessing ? "L'IA classe vos documents, vous pouvez prendre un café mais ne fermez pas la page !"  : "Ou cliquez pour parcourir vos fichiers. L'IA s'occupe de l'OCR et du rangement."}
                </p>
              </div>
              {ocrProcessing && (
                <div className="mt-8 w-full max-w-md mx-auto">
                  <div className="flex justify-between text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">
                    <span>Traitement</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-500 ease-out animate-pulse" 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <input ref={multiInputRef} type="file" className="hidden" multiple onChange={(e) => { if (e.target.files) { enqueueFiles(e.target.files); e.target.value = "" } }} />
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">📊 Session actuelle</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                    <span className="text-sm text-gray-600">Total à traiter</span>
                    <span className="font-black text-lg">{processingStatus.total}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-2xl">
                    <span className="text-sm text-green-700 font-medium">Succès IA</span>
                    <span className="font-black text-lg text-green-600 tracking-tighter">+{processingStatus.completed}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-2xl">
                    <span className="text-sm text-red-700 font-medium">Échecs / À classer</span>
                    <span className="font-black text-lg text-red-600 tracking-tighter">-{processingStatus.failed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {ocrResults.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900">Journal d&apos;analyse</h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full uppercase tracking-widest">Derniers scans</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {[...ocrResults].sort((a, b) => (a.success === b.success ? 0 : a.success ? 1 : -1)).map((result, index) => (
                  <div 
                    key={index} 
                    className={`group p-4 rounded-2xl border transition-all duration-200 ${
                      result.success 
                        ? "bg-white border-gray-100 hover:border-green-200" 
                        : "bg-red-50 border-red-100 ring-2 ring-red-500/10"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        result.success ? "bg-green-100 text-green-600" : "bg-red-200 text-red-600 animate-pulse"
                      }`}>
                        {result.success ? "✓" : "⚠️"}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-3">
                           <p className={`font-bold ${result.success ? "text-gray-800" : "text-red-700"}`}>{result.fileName}</p>
                          {!result.success && (
                            <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black uppercase">Action requise</span>
                          )}
                        </div>
                        {result.success ? (
                          <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">Document classé avec succès : {result.result?.fileName || "Nom généré"}</p>
                        ) : (
                          <p className="text-sm text-red-600 mt-1 font-semibold">{result.error || "Impossible de déterminer le dossier de destination."}</p>
                        )}
                      </div>
                      {result.success && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                           <pre className="text-[10px] bg-gray-50 p-2 rounded-lg max-w-xs overflow-hidden truncate">{JSON.stringify(result.result)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
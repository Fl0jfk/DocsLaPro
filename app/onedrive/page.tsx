"use client";
import { useState, useEffect, useRef } from "react";
import * as msal from "@azure/msal-browser";

const msalConfig: msal.Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_TENANT_ID}`,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}onedrive`,
  },
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

export default function OneDriveUpDocsOCRAI() {
  const [account, setAccount] = useState<msal.AccountInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [files, setFiles] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [msalReady, setMsalReady] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("");
  const [ocrProcessing, setOcrProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ocrResults, setOcrResults] = useState<any[]>([]);
  const [processingStatus, setProcessingStatus] = useState<{ total: number; completed: number; failed: number;}>({ total: 0, completed: 0, failed: 0});
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
          const tokenResponse = await msalInstance.acquireTokenSilent({ account: accounts[0], scopes: ["Files.ReadWrite", "User.Read"]});
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
          const tokenResponse = await msalInstance.acquireTokenSilent({ account: result.account, scopes: ["Files.ReadWrite", "User.Read"],});
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
      await msalInstance.loginRedirect({ scopes: ["Files.ReadWrite", "User.Read"]});
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
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
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
  const handleUpload = async (file: File) => {
    if (!file || !account || !msalReady || !accessToken) return;
    try {
      const uploadPath = currentFolderPath ? `${currentFolderPath}/${file.name}` : file.name;
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${uploadPath}:/content`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        }
      );
      if (!res.ok) throw new Error(await res.text());
      await fetchFiles(accessToken, currentFolder, currentFolderPath);
      alert("Upload terminé !");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError("Erreur upload: " + err.message);
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openFile = async (file: any) => {
    if (file.folder && accessToken) {
      const newPath = currentFolderPath  ? `${currentFolderPath}/${file.name}` : file.name;
      await fetchFiles(accessToken, file.id, newPath);
    } else if (!file.folder) {
      window.open(file.webUrl, "_blank");
    }
  };
  async function processInBatches<T, R>( items: T[], batchSize: number, processFn: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processFn));
      results.push(...batchResults);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentCompleted = results.filter((r: any) => r.success).length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentFailed = results.filter((r: any) => !r.success).length;
      setProcessingStatus((prev) => ({
        total: prev.total,
        completed: currentCompleted,
        failed: currentFailed,
      }));
      if (i + batchSize < items.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    return results;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processSingleFile = async (  file: File): Promise<{ success: boolean; result?: any; error?: string; fileName: string }> => {
    try {
      if (!accessToken) {
        throw new Error("Pas de token OneDrive disponible");
      }
      const r1 = await fetch("/api/upload-url", {
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
      if (!odRes.ok) { 
        throw new Error("Échec upload OneDrive Temp : " + (await odRes.text()));
      }
      const r2 = await fetch("/api/ocr-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!r2.ok) throw new Error(await r2.text());
      const { jobId } = await r2.json();
      if (!jobId) throw new Error("Impossible de lancer Textract");
      let extractedText = "";
      for (let i = 0; i < 30; i++) {
        const r3 = await fetch("/api/ocr-result", {
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
      const r4 = await fetch("/api/analyze-doc", {
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
        if (!targetFolderPath) {
          return { success: false, error:"Aucun élève trouvé de manière fiable, veuillez ranger ce document manuellement.", fileName: file.name, result: ai};
        }
        const moveRes = await fetch("/api/move-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,
            sourcePath,
            targetFolderPath,
            newFileName,
          }),
        });
        if (!moveRes.ok) {
          throw new Error(
            "Erreur le fichier n'a pas pu être déplacé, aucun dossier élèves ne correspond.: " + (await moveRes.text())
          );
        }
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
    setProcessingStatus({ total: filesToProcess.length, completed: 0, failed: 0});
    try {
      const results = await processInBatches( filesToProcess, 2, processSingleFile);
      const completed = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      setProcessingStatus({ total: filesToProcess.length, completed, failed});
      setOcrResults(results);
      await fetchFiles(accessToken, currentFolder, currentFolderPath);
      alert(`Traitement terminé!\n✅ Réussis: ${completed}\n❌ Échecs: ${failed}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError("Erreur globale OCR / Analyse: " + err.message);
    } finally {
      setOcrProcessing(false);
      if (multiInputRef.current) { multiInputRef.current.value = ""}
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      enqueueFiles(e.dataTransfer.files);
    }
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
      <div className="p-4 max-w-[80%] mx-auto">
        <h2 className="text-2xl font-bold mb-4">Mon OneDrive</h2>
        <p>Initialisation de MSAL…</p>
      </div>
    );
  }
  const dropDisabled = !account || !accessToken || ocrProcessing;
  return (
    <div className="p-4 max-w-[80%] mx-auto">
      <h2 className="text-2xl font-bold mb-4">Mon OneDrive</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {!account ? ( <button onClick={login} className="p-2 bg-blue-600 text-white rounded mt-2"> Se connecter à OneDrive</button>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <label className="p-2 bg-green-500 text-white rounded cursor-pointer">Choisir un fichier
              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}/>
            </label>
          </div>
          <div className="mb-4">
            <div className={` border-2 border-dashed rounded p-4 text-center cursor-pointer transition${ isDragging ? "border-purple-600 bg-purple-50" : "border-purple-300 bg-white"}${dropDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onDragOver={dropDisabled ? undefined : handleDragOver}
              onDragLeave={dropDisabled ? undefined : handleDragLeave}
              onDrop={dropDisabled ? undefined : handleDrop}
              onClick={() => !dropDisabled && multiInputRef.current?.click()}
            >
              <p className="font-semibold text-purple-700">  Glissez-déposez vos PDF ici</p>
              <p className="text-xs text-gray-500">ou cliquez pour sélectionner des fichiers (OCR + Analyse)</p>
              {dropDisabled && !ocrProcessing && (
                <p className="mt-2 text-sm text-red-500">Connectez-vous à OneDrive pour activer l&apos;envoi.</p>
              )}
              {ocrProcessing && (
                <p className="mt-2 text-sm text-gray-600">Traitement en cours… ({processingStatus.completed + processingStatus.failed}/{processingStatus.total})
                  <br />Vous pourrez ajouter d&apos;autres fichiers une fois ce batch terminé.
                </p>
              )}
              {pendingFiles.length > 0 && !ocrProcessing && (
                <p className="mt-2 text-sm text-gray-600">{pendingFiles.length} fichier(s) en attente de traitement</p>
              )}
            </div>
            <input ref={multiInputRef} type="file" className="hidden" multiple onChange={(e) => { if (e.target.files) { enqueueFiles(e.target.files); e.target.value = ""}}}/>
          </div>
          {ocrResults.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold mb-2">Résultats du traitement:</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {ocrResults.map((result, index) => (
                  <div  key={index} className={`p-3 rounded ${ result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                    <div className="font-semibold flex items-center gap-2">{result.success ? "✅" : "❌"} {result.fileName}</div>
                    {result.success ? (
                      <pre className="text-xs bg-white p-2 rounded mt-2 overflow-x-auto">{JSON.stringify(result.result, null, 2)}</pre>
                    ) : (
                      <p className="text-red-600 text-sm mt-1">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {currentFolderPath && accessToken && (
            <button onClick={async () => { const parentPath = currentFolderPath.split("/").slice(0, -1).join("/"); await fetchFiles(accessToken, null, parentPath)}} className="mb-2 text-blue-500 underline">← Revenir à la racine</button>
          )}
          <ul className="border rounded p-2 space-y-1 bg-gray-50">
            {files.map((f) => (
              <li key={f.id || f.name} className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded" onClick={() => openFile(f)}>{f.folder ? "📁" : "📄"} {f.name}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
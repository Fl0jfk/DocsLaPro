"use client";
import { useState, useEffect } from "react";
import * as msal from "@azure/msal-browser";

const msalConfig: msal.Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_TENANT_ID}`,
    redirectUri: "http://localhost:3000/onedrive",
  },
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

export default function OneDriveTest() {
  const [account, setAccount] = useState<msal.AccountInfo | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [files, setFiles] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [msalReady, setMsalReady] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("");
  const [ocrProcessing, setOcrProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ocrResult, setOcrResult] = useState<any>(null);
  useEffect(() => {
    const init = async () => {
      try {
        await msalInstance.initialize(); 
        setMsalReady(true);
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const token = await getAccessToken(accounts[0]);
          fetchFiles(token, null, "");
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
          const token = await getAccessToken(result.account);
          fetchFiles(token, null, "");
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
      await msalInstance.loginRedirect({
        scopes: ["Files.ReadWrite", "User.Read"],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError("Erreur login: " + err.message);
    }
  };
  const getAccessToken = async (acc?: msal.AccountInfo) => {
    const usedAccount = acc || account;
    if (!usedAccount) throw new Error("Aucun compte connecté");
    const tokenResponse = await msalInstance.acquireTokenSilent({
      account: usedAccount,
      scopes: ["Files.ReadWrite", "User.Read"],
    });
    return tokenResponse.accessToken;
  };
  const fetchFiles = async (accessToken: string, folderId: string | null, folderPath: string) => {
    try {
      const url = folderId ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children` : folderPath ? `https://graph.microsoft.com/v1.0/me/drive/root:/${folderPath}:/children` : "https://graph.microsoft.com/v1.0/me/drive/root/children";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
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
    if (!file || !account) return;
    try {
      const accessToken = await getAccessToken();
      const uploadPath = currentFolderPath ? `${currentFolderPath}/${file.name}` : file.name;
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${uploadPath}:/content`,
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
    if (file.folder) {
      const token = await getAccessToken();
      const newPath = currentFolderPath ? `${currentFolderPath}/${file.name}` : file.name;
      fetchFiles(token, file.id, newPath);
    } else {
      window.open(file.webUrl, "_blank");
    }
  };
  const handleOcrUploadAndAnalyse = async (file: File) => {
    if (!file) return;
    try {
      setOcrProcessing(true);
      setError("");
      const r1 = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!r1.ok) throw new Error(await r1.text());
      const { url, key } = await r1.json();
      const upload = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!upload.ok) throw new Error("Échec upload S3 : " + (await upload.text()));
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
        if (data.status === "IN_PROGRESS") await new Promise(r => setTimeout(r, 5000));
        else throw new Error("OCR Textract a échoué : " + JSON.stringify(data));
      }
      if (!extractedText) throw new Error("Timeout OCR : aucun texte retourné");
      const r4 = await fetch("/api/analyze-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });
      if (!r4.ok) throw new Error(await r4.text());
      const ai = await r4.json();
      setOcrResult(ai);
      if (ai?.type && ai?.eleve?.nom && ai?.eleve?.prénom) {
        const safeType = ai.type.replace(/[^a-zA-Z0-9_]/g, "_");
        const safeNom = ai.eleve.nom.replace(/[^a-zA-Z0-9_]/g, "_");
        const safePrenom = ai.eleve.prénom.replace(/[^a-zA-Z0-9_]/g, "_");
        const newFileName = `${safeType}_${safeNom}_${safePrenom}.pdf`;
        const accessToken = await getAccessToken();
        const uploadPath = currentFolderPath ? `${currentFolderPath}/${newFileName}` : newFileName;
        const fileRes = await fetch(
          `https://graph.microsoft.com/v1.0/me/drive/root:/${uploadPath}:/content`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": file.type || "application/pdf",
            },
            body: file,
          }
        );
        if (!fileRes.ok) throw new Error("Erreur upload OneDrive : " + (await fileRes.text()));
        await fetchFiles(accessToken, currentFolder, currentFolderPath);
        alert("Analyse terminée et fichier renommé uploadé !");
      } else {
        alert("Analyse terminée, mais impossible de récupérer type/nom/prénom pour le renommage.");
      }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError("Erreur OCR / Analyse: " + err.message);
    } finally {
      setOcrProcessing(false);
    }
  };
  return (
    <div className="p-4 max-w-[80%] mx-auto">
      <h2 className="text-2xl font-bold mb-4">Mon OneDrive</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {!account ? (
        <button onClick={login} className="p-2 bg-blue-600 text-white rounded mt-2">
          Se connecter à OneDrive
        </button>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <label className="p-2 bg-green-500 text-white rounded cursor-pointer">
              Choisir un fichier
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </label>
          </div>
          <div className="flex gap-2 mb-4">
            <label className="p-2 bg-purple-500 text-white rounded cursor-pointer">
              Envoyer pour OCR + Analyse
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleOcrUploadAndAnalyse(e.target.files[0])}
                disabled={ocrProcessing}
              />
            </label>
            {ocrProcessing && <span className="ml-2">Traitement en cours…</span>}
          </div>

          {ocrResult && (
            <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(ocrResult, null, 2)}
            </pre>
          )}

          {currentFolderPath && (
            <button
              onClick={async () => {
                const token = await getAccessToken();
                const parentPath = currentFolderPath.split("/").slice(0, -1).join("");
                fetchFiles(token, null, parentPath);
              }}
              className="mb-2 text-blue-500 underline"
            >
              ← Revenir à la racine
            </button>
          )}

          <ul className="border rounded p-2 space-y-1 bg-gray-50">
            {files.map((f) => (
              <li
                key={f.id || f.name}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded"
                onClick={() => openFile(f)}
              >
                {f.folder ? "📁" : "📄"} {f.name}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

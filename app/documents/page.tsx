'use client';

import { useState, useEffect } from "react";

type DocumentNode = {
  type: "folder" | "file";
  name: string;
  path: string;
  ext?: string;
};

export default function DocumentsPage() {
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [items, setItems] = useState<DocumentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const cacheKey = (prefix: string) => `documents_cache_${prefix}`;
  const cacheTTL = 15 * 60 * 1000;
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedDest, setSelectedDest] = useState("");
  const fetchDocuments = async (prefix: string, forceRefresh = false) => {
    setLoading(true);
    if (!forceRefresh) {
      const cachedRaw = localStorage.getItem(cacheKey(prefix));
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (Date.now() - cached.timestamp < cacheTTL) {
          setItems(cached.data);
          setLoading(false);
          return;
        }
      }
    }
    try {
      const res = await fetch(`/api/documents/list?prefix=${encodeURIComponent(prefix)}`);
      const data = await res.json();
      if (data.error) {
        setItems([]);
      } else {
        setItems(data);
        localStorage.setItem(cacheKey(prefix), JSON.stringify({
          data,
          timestamp: Date.now(),
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDocuments(currentPrefix);
  }, [currentPrefix]);
  const enterFolder = (path: string) => { 
    setHistory(prev => [...prev, currentPrefix]); 
    setCurrentPrefix(path);
    setSelectedDest(""); 
  };
  const goBack = () => {
    const prev = history.pop();
    if (prev !== undefined) {
      setHistory([...history]);
      setCurrentPrefix(prev);
    }
  };
  const getFileIcon = (ext?: string) => {
    if (!ext) return "📄";
    switch (ext.toLowerCase()) {
      case "pdf": return "📄";
      case "doc": case "docx": return "📝";
      case "xls": case "xlsx": return "📊";
      default: return "📄";
    }
  };
  const handleDownload = async (path: string) => {
    setDownloading(path);
    try {
      const res = await fetch(`/api/documents/get-url?key=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = path.split("/").pop()!;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert("Erreur lors de la génération du lien sécurisé.");
      }
    } catch (e) {
      alert("Erreur téléchargement : " + String(e));
    }
    setDownloading(null);
  };
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDest) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", selectedDest);
    try {
      const res = await fetch("/api/documents/upload", { 
        method: "POST", 
        body: formData 
      }); 
      if (res.ok) {
        localStorage.removeItem(cacheKey(currentPrefix));
        localStorage.removeItem(cacheKey(selectedDest));
        alert("Fichier chargé avec succès !");
        fetchDocuments(currentPrefix, true);
        e.target.value = "";
      } else {
        const errorData = await res.json();
        alert("Erreur : " + (errorData.error || "Impossible d'uploader"));
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de l'envoi.");
    } finally {
      setUploading(false);
    }
  };
  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-600">Chargement en cours…</p>
        </div>
      </div>
    );
  }
  return (
    <main className="flex flex-col gap-4 p-4 w-full mx-auto max-w-[1000px] sm:pt-[10vh]">
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-4 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex flex-col gap-1 w-full sm:w-1/2">
          <label className="text-xs font-bold text-gray-500 uppercase px-1">Dossier de destination</label>
          <select  className="p-2 border rounded-lg bg-white text-sm" value={selectedDest} onChange={(e) => setSelectedDest(e.target.value)}>
            <option value="">-- Choisir où uploader --</option>
            {items.filter(i => i.type === "folder").map((folder) => (
              <option key={folder.path} value={folder.path}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-1/2">
          <label className="text-xs font-bold text-gray-500 uppercase px-1">Sélectionner un document</label>
          <input  type="file"  onChange={handleUpload} disabled={!selectedDest || uploading} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 cursor-pointer"/>
        </div>
        {uploading && <div className="text-blue-500 text-xs font-medium animate-pulse mb-2 text-center w-full sm:w-auto">Envoi...</div>}
      </div>
      <div className="flex items-center justify-between h-8">
        {history.length > 0 && (
          <button onClick={goBack} className="flex items-center space-x-2 text-sm text-blue-500 hover:text-blue-700 transition-colors duration-200">← Retour</button>
        )}
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 relative">
          {loading && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">Actualisation...</div>}
          {items.map((item, idx) => (
            <div key={idx} onClick={() => item.type === "folder" ? enterFolder(item.path) : handleDownload(item.path)} className="cursor-pointer flex flex-col items-center max-h-[150px]">
              <div className="text-5xl mb-2">{item.type === "folder" ? "📁" : getFileIcon(item.ext)}</div>
              <div className="text-center text-xs font-medium break-words w-full px-1 line-clamp-2">{item.name}{item.ext ? `.${item.ext}` : ""}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-10">Aucun document disponible pour ce dossier.</p>
      )}
    </main>
  );
}
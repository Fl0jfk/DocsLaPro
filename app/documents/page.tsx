'use client';

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

type DocumentNode = {
  type: "folder" | "file";
  name: string;
  path: string;
  ext?: string;
};

export default function DocumentsPage() {
  const { user, isLoaded } = useUser();
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [items, setItems] = useState<DocumentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedDest, setSelectedDest] = useState("");

  useEffect(() => {
    if (isLoaded && user) {
      const roles = (user.publicMetadata.role as string[]) || [];
      let defaultPath = "";
      if (roles.includes("professeur")) defaultPath = "documents/professeurs/";
      else if (roles.includes("comptabilité")) defaultPath = "documents/Compta RH/";
      else if (roles.includes("administratif")) defaultPath = "documents/administratif/";
      else if (roles.includes("direction")) defaultPath = "documents/direction/";
      else if (roles.includes("education")) defaultPath = "documents/education/";

      setCurrentPrefix(defaultPath);
      setSelectedDest(defaultPath);
    }
  }, [isLoaded, user]);

  const fetchDocuments = async (prefix: string) => {
    if (!prefix && isLoaded) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/list?prefix=${encodeURIComponent(prefix)}`);
      const data = await res.json();
      setItems(data.error ? [] : data);
    } catch (err) {
      console.error(err)
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentPrefix || isLoaded) {
      fetchDocuments(currentPrefix);
      setSelectedDest(currentPrefix);
    }
  }, [currentPrefix, isLoaded]);

  const enterFolder = (path: string) => { 
    setHistory(prev => [...prev, currentPrefix]); 
    setCurrentPrefix(path);
  };

  const goBack = () => {
    const prev = history.pop();
    if (prev !== undefined) {
      setHistory([...history]);
      setCurrentPrefix(prev);
    }
  };
  const getFileIcon = (ext?: string) => {
    switch (ext?.toLowerCase()) {
      case "pdf": return "📕";
      case "doc": case "docx": return "📘";
      case "xls": case "xlsx": return "📗";
      default: return "📄";
    }
  };
  const handleDownload = async (path: string) => {
    setDownloading(path);
    try {
      const res = await fetch(`/api/documents/get-url?key=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } catch (e) {
      console.error(e)
      alert("Erreur de connexion");
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
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData }); 
      if (res.ok) {
        fetchDocuments(currentPrefix);
        e.target.value = "";
      }
    } finally {
      setUploading(false);
    }
  };
  if (!isLoaded) return null;
  return (
    <main className="flex flex-col gap-6 p-6 w-full mx-auto max-w-[1100px] sm:pt-[8vh]">
      <section className="bg-white border border-gray-200 shadow-sm p-5 rounded-2xl flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <h1 className="text-xl font-bold text-gray-800">Mes Documents</h1>
          <p className="text-sm text-gray-500">Gérez et partagez vos ressources</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select 
            className="p-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={selectedDest} 
            onChange={(e) => setSelectedDest(e.target.value)}
          >
            <option value={currentPrefix}>📂 Dossier actuel</option>
            {items.filter(i => i.type === "folder").map((f) => (
              <option key={f.path} value={f.path}>↳ {f.name}</option>
            ))}
          </select>

          <label className={`relative flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'}`}>
            {uploading ? "Envoi en cours..." : "＋ Ajouter un fichier"}
            <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
      </section>
      <div className="flex items-center gap-3">
        {history.length > 0 && (
          <button 
            onClick={goBack} 
            className="p-2 hover:bg-gray-100 rounded-full text-blue-600 transition-colors"
            title="Retour"
          >
            <span className="text-xl">⬅️</span>
          </button>
        )}
        <div className="flex items-center text-sm font-medium text-gray-400 overflow-hidden">
          <span className="hover:text-gray-600 cursor-default">Cloud</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800 truncate italic">
            {currentPrefix.split('/').filter(Boolean).pop() || "Racine"}
          </span>
        </div>
      </div>
      <div className="relative min-h-[400px] bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 p-8">
        {loading && (
          <div className="absolute top-4 right-4">
            <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
          </div>
        )}

        {items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-8">
            {items.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => item.type === "folder" ? enterFolder(item.path) : handleDownload(item.path)} 
                className="group flex flex-col items-center p-4 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-gray-100"
              >
                <div className="text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {item.type === "folder" ? "📁" : getFileIcon(item.ext)}
                </div>
                <span className="text-center text-xs font-semibold text-gray-700 break-words w-full line-clamp-2 px-1">
                  {item.name}
                  {item.ext && <span className="text-gray-400 uppercase text-[9px] block">.{item.ext}</span>}
                </span>
                {downloading === item.path && (
                  <div className="mt-2 text-[10px] text-blue-500 font-bold animate-pulse">Ouverture...</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
            <span className="text-5xl mb-4">📭</span>
            <p className="italic">Ce dossier ne contient aucun document.</p>
          </div>
        )}
      </div>
    </main>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

const PROVIDER_EMAILS: Record<string, string> = {
  "Cars Bleus":"carbleus@mail.fr",
  "Perrier": "perrier-voyages@orange.fr",
  "Reflexe": "florian.hacqueville-mathi@ac-normandie.fr",
  "Hangard": "hangard.autocars@outlook.fr",
};

export default function DevisPublicPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const providerFromUrl = searchParams.get("p") || "";
  const emailParam = searchParams.get("e") || "";
  const emailFromUrl = emailParam || PROVIDER_EMAILS[providerFromUrl] || "";
  const [trip, setTrip] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [providerName, setProviderName] = useState(providerFromUrl);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/travels/get?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setTrip(data);
        }
      } catch (err) {
        console.error("Erreur de chargement", err);
      }
    };
    if (id) fetchTrip();
  }, [id]);
  useEffect(() => {
    if (providerFromUrl) setProviderName(providerFromUrl);
  }, [providerFromUrl]);
  const handleUpload = async () => {
    if (!file || !providerName) {
      alert("Merci de choisir un fichier.");
      return;
    }
    if (!emailFromUrl) {
      alert("Erreur : Email de contact non identifié.");
      return;
    }
    setStatus("uploading");
    try {
      const resAuth = await fetch("/api/travels/upload-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          tripId: id,
          providerName: providerName
        }),
      });
      if (!resAuth.ok) throw new Error("Erreur autorisation");
      const { uploadUrl, fileUrl } = await resAuth.json();
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });
      if (uploadRes.ok) {
        const confirmRes = await fetch("/api/travels/confirm-devis", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId: id,
            providerName: providerName,
            providerEmail: emailFromUrl,
            fileUrl: fileUrl 
          }),
        });

        if (confirmRes.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };
  if (!trip) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="animate-pulse text-slate-500 font-medium">Chargement de la demande de devis...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 transition-all">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-indigo-200 mb-4">
            🚌
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Espace Transporteur</h1>
          <p className="text-slate-500 font-medium mt-1 text-center">
            Dépôt de devis pour : <span className="text-indigo-600">{trip.data.title}</span>
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[2rem] text-center animate-in zoom-in duration-300">
            <span className="text-4xl mb-4 block">✅</span>
            <h2 className="text-emerald-900 font-bold text-xl mb-2">Devis transmis !</h2>
            <p className="text-emerald-700 text-sm">Merci <strong>{providerName}</strong>, le dossier a été mis à jour.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Détails de la demande</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 font-bold text-[10px] uppercase">Destination</p>
                  <p className="font-bold text-slate-700 leading-tight">{trip.data.destination}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[10px] uppercase">Effectif</p>
                  <p className="font-bold text-slate-700">
                    {Number(trip.data.nbEleves || 0) + Number(trip.data.nbAccompagnateurs || 0)} pers.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-2 mb-2 block">Société</label>
                  <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700">
                    {providerName || "Non spécifiée"}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-2 mb-2 block">Email de contact</label>
                  <div className={`w-full border-2 rounded-2xl px-5 py-3 font-bold truncate text-sm ${
                    emailFromUrl ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-red-50 border-red-100 text-red-600'
                  }`}>
                    {emailFromUrl || "Email manquant !"}
                  </div>
                </div>
              </div>

              <div className="relative group">
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden" 
                  id="file-input" 
                />
                <label 
                  htmlFor="file-input"
                  className="w-full border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
                >
                  <span className="text-2xl mb-2">{file ? "📄" : "☁️"}</span>
                  <p className="text-sm font-bold text-slate-600 text-center px-4">
                    {file ? file.name : "Cliquez pour joindre votre devis (PDF)"}
                  </p>
                </label>
              </div>

              <button 
                onClick={handleUpload}
                disabled={status === "uploading" || !file || !providerName || !emailFromUrl}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all"
              >
                {status === "uploading" ? "TRANSFERT EN COURS..." : "TRANSMETTRE LE DEVIS"}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-slate-400 mt-8 font-medium">
          Dépôt sécurisé • Document transmis directement à l'organisateur
        </p>
      </div>
    </div>
  );
}
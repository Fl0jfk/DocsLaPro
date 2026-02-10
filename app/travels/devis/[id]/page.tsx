"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function DevisPublicPage() {
  const { id } = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trip, setTrip] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [providerName, setProviderName] = useState("");
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
  const handleUpload = async () => {
    if (!file || !providerName) {
      alert("Merci d'indiquer votre nom et de choisir un fichier.");
      return;
    }
    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tripId", id as string);
    formData.append("providerName", providerName);
    try {
      const res = await fetch("/api/public/upload-devis", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error(err)
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
        
        {/* LOGO / ICON */}
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
            <p className="text-emerald-700 text-sm">Le dossier a été mis à jour. Nous reviendrons vers vous rapidement.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* RÉCAPITULATIF BESOIN */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Détails de la demande</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Destination</p>
                  <p className="font-bold text-slate-700">{trip.data.destination}</p>
                </div>
                <div>
                  <p className="text-slate-400">Date</p>
                  <p className="font-bold text-slate-700">{trip.data.startDate || trip.data.date}</p>
                </div>
                <div>
                  <p className="text-slate-400">Effectif</p>
                  <p className="font-bold text-slate-700">{trip.data.nbEleves} pers.</p>
                </div>
                <div>
                  <p className="text-slate-400">Départ</p>
                  <p className="font-bold text-slate-700">{trip.data.startTime || "N/C"}</p>
                </div>
              </div>
            </div>

            {/* FORMULAIRE */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-2 mb-2 block">Nom de votre société</label>
                <input 
                  type="text"
                  placeholder="Ex: Perrier Voyages"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3 outline-none transition-all font-medium"
                />
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
                  <p className="text-sm font-bold text-slate-600">
                    {file ? file.name : "Cliquez pour joindre le devis (PDF)"}
                  </p>
                </label>
              </div>

              {status === "error" && (
                <p className="text-red-500 text-xs font-bold text-center">Une erreur est survenue lors de l&apos;envoi.</p>
              )}

              <button 
                onClick={handleUpload}
                disabled={status === "uploading" || !file || !providerName}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all"
              >
                {status === "uploading" ? "Transmission en cours..." : "ENVOYER LE DEVIS"}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-slate-400 mt-8 font-medium">
          Plateforme de gestion des voyages scolaires • Sécurisé par AWS S3
        </p>
      </div>
    </div>
  );
}
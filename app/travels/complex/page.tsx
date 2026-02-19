"use client";

import { useUser } from "@clerk/nextjs";
import { useState, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";

function ComplexTripFormContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busProgramRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPiqueNiqueModal, setShowPiqueNiqueModal] = useState(false);
  const [showBusRecapModal, setShowBusRecapModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    objectifs: "",
    // Dates et Heures
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    // Participants
    nbEleves: "",
    classes: "",
    nbAccompagnateurs: 1,
    nomsAccompagnateurs: "",
    // Logistique & Transport Spécifique
    needsBus: false,
    transportRequest: {
      pickupPoint: "",
      stayOnSite: false,
      freeText: "", 
      busProgramFile: null as { name: string, url: string } | null,
    },
    piqueNiqueDetails: {
      active: false,
      total: 0,
      sansPorc: 0,
      vegetarien: 0,
      allergies: ""
    },
    // Budget
    coutTotal: 0,
    partFamille: 0,
    partEtablissement: 0,
    // Documents
    attachments: [] as { name: string, url: string }[]
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isBusProgram = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newAttachments = [...formData.attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await fetch('/api/travels/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileType: file.type })
        });
        const { uploadUrl, fileUrl } = await res.json();
        
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        if (isBusProgram) {
          setFormData(prev => ({
            ...prev,
            transportRequest: { ...prev.transportRequest, busProgramFile: { name: file.name, url: fileUrl } }
          }));
        } else {
          newAttachments.push({ name: file.name, url: fileUrl });
        }
      } catch (error) {
        console.error("Erreur upload:", error);
        alert(`Erreur pour le fichier ${file.name}`);
      }
    }

    if (!isBusProgram) setFormData(prev => ({ ...prev, attachments: newAttachments }));
    setUploading(false);
  };

  const removeFile = (index: number) => {
    const updated = formData.attachments.filter((_, i) => i !== index);
    setFormData({ ...formData, attachments: updated });
  };

  const executeSubmit = async () => {
    setLoading(true);
    const tripId = `trip-${Date.now()}`;
    const payload = {
      id: tripId,
      ownerName: user?.fullName || "Professeur inconnu",
      ownerEmail: user?.primaryEmailAddress?.emailAddress,
      status: "PENDING_DIR_INITIAL",
      type: "COMPLEX",
      createdAt: new Date().toISOString(),
      data: formData
    };

    try {
      const res = await fetch("/api/travels/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tripId, data: payload }),
      });

      if (res.ok) {
        if (formData.needsBus) {
          // On envoie le payload complet qui contient .data.transportRequest.busProgramFile
          await fetch("/api/travels/send-transport", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              tripData: payload,
              userEmail: user?.primaryEmailAddress?.emailAddress,
              userName: user?.fullName 
            }),
          });
        }
        router.push("/travels");
        router.refresh();
      } else {
        alert("Erreur lors de la sauvegarde.");
      }
    } catch (err) {
      alert("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.needsBus) {
      setShowBusRecapModal(true);
    } else {
      executeSubmit();
    }
  };

  if (!isLoaded) return <div className="p-10 text-center font-medium">Chargement...</div>;

  return (
    <main className="max-w-5xl mx-auto p-8 pb-24 text-left">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nouveau Voyage Scolaire</h1>
          <p className="text-slate-500 font-medium text-sm">Séjours, nuitées et projets complexes.</p>
        </div>
        <button onClick={() => router.back()} className="text-sm font-bold text-indigo-600 hover:underline">Annuler</button>
      </div>

      <form onSubmit={handleSubmitAttempt} className="space-y-6">
        {/* 1. PROJET */}
        <div className="bg-white p-8 border rounded-3xl shadow-sm space-y-6">
          <div className="text-slate-400 uppercase text-xs font-bold tracking-widest border-b pb-4">1. Projet Pédagogique</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Intitulé du voyage</label>
              <input required value={formData.title} className="w-full p-3 bg-slate-50 border rounded-xl outline-indigo-500" placeholder="Ex: Séjour d'intégration en Auvergne" onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Objectifs pédagogiques</label>
              <textarea required rows={3} value={formData.objectifs} className="w-full p-3 bg-slate-50 border rounded-xl outline-indigo-500" placeholder="Quels sont les buts de ce voyage ?" onChange={e => setFormData({...formData, objectifs: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Lieu et destination exacte</label>
              <input required value={formData.destination} className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Adresse du centre, ville, pays..." onChange={e => setFormData({...formData, destination: e.target.value})} />
            </div>
          </div>
        </div>

        {/* 2. PARTICIPANTS & BUDGET */}
        <div className="bg-white p-8 border rounded-3xl shadow-sm space-y-6">
          <div className="text-slate-400 uppercase text-xs font-bold tracking-widest border-b pb-4">2. Participants & Budget estimé</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Nombre d'élèves</label>
              <input type="number" required value={formData.nbEleves} className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, nbEleves: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Classes concernées</label>
              <input required value={formData.classes} className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Ex: 3ème A, B, C" onChange={e => setFormData({...formData, classes: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Nb accompagnateurs</label>
              <input type="number" required value={formData.nbAccompagnateurs} className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, nbAccompagnateurs: Number(e.target.value)})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Noms des accompagnateurs</label>
              <input required value={formData.nomsAccompagnateurs} className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Liste des collègues..." onChange={e => setFormData({...formData, nomsAccompagnateurs: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-indigo-600">Coût global estimé (€)</label>
              <input type="number" required className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold" placeholder="Total du projet" onChange={e => setFormData({...formData, coutTotal: Number(e.target.value)})} />
            </div>
          </div>
        </div>

        {/* 3. DATES & HORAIRES */}
        <div className="bg-white p-8 border rounded-3xl shadow-sm space-y-6">
          <div className="text-slate-400 uppercase text-xs font-bold tracking-widest border-b pb-4">3. Dates et Horaires</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Date Départ</label><input type="date" required className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Heure de RDV</label><input type="time" required className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, startTime: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Date Retour</label><input type="date" required className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Heure retour prévue</label><input type="time" required className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, endTime: e.target.value})} /></div>
          </div>
        </div>

        {/* 4. LOGISTIQUE & TRANSPORT */}
        <div className="bg-white p-8 border rounded-3xl shadow-sm space-y-6">
          <div className="text-slate-400 uppercase text-xs font-bold tracking-widest border-b pb-4">4. Logistique & Restauration</div>
          
          <div className={`p-6 rounded-2xl border-2 transition-all ${formData.needsBus ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Besoin d'un Autocar ?</h3>
                <p className="text-xs text-slate-500">Activer pour soumettre une demande de devis transporteur.</p>
              </div>
              <input type="checkbox" className="w-6 h-6 accent-amber-600 cursor-pointer" checked={formData.needsBus} onChange={e => setFormData({...formData, needsBus: e.target.checked})} />
            </div>

            {formData.needsBus && (
              <div className="mt-6 p-4 bg-white border border-amber-200 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-sm font-bold text-amber-800">Détails pour le transporteur</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">Lieu de prise en charge (RDV)</label>
                    <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Ex: Devant le gymnase" onChange={e => setFormData({...formData, transportRequest: {...formData.transportRequest, pickupPoint: e.target.value}})} />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="stayOnSite" className="w-5 h-5" checked={formData.transportRequest.stayOnSite} onChange={e => setFormData({...formData, transportRequest: {...formData.transportRequest, stayOnSite: e.target.checked}})} />
                    <label htmlFor="stayOnSite" className="text-xs font-bold text-slate-600 cursor-pointer">Le bus reste sur place pour les visites</label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Informations complémentaires (vols, horaires atterrissage...)</label>
                  <textarea rows={2} className="w-full p-3 bg-slate-50 border rounded-xl text-sm" placeholder="Ex: Heure de décollage 14h30, Heure d'atterrissage prévue 18h00, Numéro de vol AF123..." value={formData.transportRequest.freeText} onChange={e => setFormData({...formData, transportRequest: {...formData.transportRequest, freeText: e.target.value}})} />
                </div>

                <div className="border-t pt-4">
                  <label className="block text-xs font-bold mb-2">Programme complet pour le chauffeur (Optionnel si transfert simple)</label>
                  <input type="file" ref={busProgramRef} className="hidden" onChange={(e) => handleFileUpload(e, true)} />
                  <button type="button" onClick={() => busProgramRef.current?.click()} className="text-xs py-2 px-4 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700">
                    {formData.transportRequest.busProgramFile ? "✅ Programme transport joint" : "📎 Joindre un programme PDF / Excel"}
                  </button>
                  {formData.transportRequest.busProgramFile && <p className="text-[10px] mt-1 text-slate-500 italic">{formData.transportRequest.busProgramFile.name}</p>}
                </div>
              </div>
            )}
          </div>

          <button type="button" onClick={() => setShowPiqueNiqueModal(true)} className={`w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${formData.piqueNiqueDetails.active ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="text-left">
              <h3 className="font-bold text-slate-900">Restauration (Cantine)</h3>
              <p className="text-xs text-slate-500">{formData.piqueNiqueDetails.active ? `✅ ${formData.piqueNiqueDetails.total} paniers` : "Cliquer pour configurer les paniers repas"}</p>
            </div>
            <span className="text-xl">🥪</span>
          </button>
        </div>

        {/* 5. PIÈCES JOINTES GÉNÉRALES */}
        <div className="bg-white p-8 border rounded-3xl shadow-sm space-y-6">
          <div className="text-slate-400 uppercase text-xs font-bold tracking-widest border-b pb-4">5. Autres documents (Pédagogie, Hébergement...)</div>
          <div className="space-y-4">
            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e)} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 flex flex-col items-center">
              <span>{uploading ? "Envoi en cours..." : "📎 Ajouter des documents généraux"}</span>
            </button>
            <div className="flex flex-wrap gap-2">
              {formData.attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700">
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button type="button" onClick={() => removeFile(idx)} className="text-red-500">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button disabled={loading || uploading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50">
          {loading ? "Création du dossier..." : "Soumettre le dossier complet"}
        </button>
      </form>

      {/* MODAL RÉCAPITULATIF TRANSPORTEUR */}
      {showBusRecapModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl border border-amber-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">🚌</div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">Vérification de la demande de transport</h2>
                <p className="text-slate-500 text-sm font-medium">Voici les informations qui seront transmises aux transporteurs.</p>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Destination</p>
                  <p className="font-bold text-slate-900">{formData.destination || "Non précisée"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Effectif Global</p>
                  <p className="font-bold text-slate-900">{Number(formData.nbEleves || 0) + Number(formData.nbAccompagnateurs || 0)} personnes</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Départ & RDV</p>
                  <p className="font-bold text-slate-900">{formData.startDate} à {formData.startTime}</p>
                  <p className="text-xs text-amber-600 font-bold">Lieu : {formData.transportRequest.pickupPoint}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Retour prévu</p>
                  <p className="font-bold text-slate-900">{formData.endDate} à {formData.endTime}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">Options & Infos complémentaires</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm font-semibold">
                    {formData.transportRequest.stayOnSite ? "✅ Bus reste sur place pour visites" : "❌ Transfert simple uniquement"}
                  </li>
                  {formData.transportRequest.freeText && (
                    <li className="p-3 bg-white rounded-xl border text-sm text-slate-700 italic">
                      "{formData.transportRequest.freeText}"
                    </li>
                  )}
                  <li className="text-sm font-bold text-indigo-600">
                    {formData.transportRequest.busProgramFile ? "📎 Programme chauffeur joint au dossier" : "⚠️ Aucun programme joint (transfert direct)"}
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setShowBusRecapModal(false)} 
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all"
              >
                MODIFIER
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowBusRecapModal(false);
                  executeSubmit();
                }} 
                className="flex-[2] py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black shadow-lg shadow-amber-200 transition-all"
              >
                VALIDER ET ENVOYER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PIQUE-NIQUE */}
      {showPiqueNiqueModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Pique-niques Cantine</h2>
            <div className="space-y-4 mt-6">
              <div><label className="block text-xs font-bold mb-1 text-left">Nombre total</label><input type="number" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.piqueNiqueDetails.total} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, total: Number(e.target.value), active: true}})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1 text-left text-emerald-700">Végétariens</label><input type="number" className="w-full p-3 bg-emerald-50 border rounded-xl" value={formData.piqueNiqueDetails.vegetarien} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, vegetarien: Number(e.target.value)}})} /></div>
                <div><label className="block text-xs font-bold mb-1 text-left text-orange-700">Sans Porc</label><input type="number" className="w-full p-3 bg-orange-50 border rounded-xl" value={formData.piqueNiqueDetails.sansPorc} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, sansPorc: Number(e.target.value)}})} /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setShowPiqueNiqueModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Fermer</button>
              <button type="button" onClick={() => setShowPiqueNiqueModal(false)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Valider</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ComplexTripForm() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ComplexTripFormContent />
    </Suspense>
  );
}
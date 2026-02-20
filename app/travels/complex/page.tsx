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
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    nbEleves: "",
    classes: "",
    nbAccompagnateurs: 1,
    nomsAccompagnateurs: "",
    needsBus: false,
    transportRequest: {
      pickupPoint: "",
      stayOnSite: false,
      freeText: "", 
      busProgramFile: null as { name: string, url: string } | null,
    },
    // NOUVELLE STRUCTURE CUISINE ALIGNÉE SUR LE PDF
    piqueNiqueDetails: {
      active: false,
      deliveryTime: "",
      deliveryPlace: "Self",
      picnicTotal: "",
      picnicNoPork: "",
      picnicVeg: "",
      selfAdults: "",
      selfStudents: "",
      breakCoffee: false,
      breakJuice: false,
      breakCakes: false,
      breakViennoiseries: false,
      breakOther: "",
      daysSelection: {
        lundi: false, mardi: false, mercredi: false, jeudi: false, vendredi: false
      }
    },
    coutTotal: 0,
    partFamille: 0,
    partEtablissement: 0,
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
              <input type="number" required className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold" placeholder="Total du projet" value={formData.coutTotal} onChange={e => setFormData({...formData, coutTotal: Number(e.target.value)})} />
            </div>
          </div>
        </div>

        {/* 3. DATES & HORAIRES */}
        <div className="bg-white p-8 border rounded-3xl shadow-sm space-y-6">
          <div className="text-slate-400 uppercase text-xs font-bold tracking-widest border-b pb-4">3. Dates et Horaires</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Date Départ</label><input type="date" required className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Heure de RDV</label><input type="time" required className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Date Retour</label><input type="date" required className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Heure retour prévue</label><input type="time" required className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} /></div>
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
                    <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Ex: Devant le gymnase" value={formData.transportRequest.pickupPoint} onChange={e => setFormData({...formData, transportRequest: {...formData.transportRequest, pickupPoint: e.target.value}})} />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="stayOnSite" className="w-5 h-5" checked={formData.transportRequest.stayOnSite} onChange={e => setFormData({...formData, transportRequest: {...formData.transportRequest, stayOnSite: e.target.checked}})} />
                    <label htmlFor="stayOnSite" className="text-xs font-bold text-slate-600 cursor-pointer">Le bus reste sur place pour les visites</label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Informations complémentaires</label>
                  <textarea rows={2} className="w-full p-3 bg-slate-50 border rounded-xl text-sm" placeholder="Ex: Numéro de vol AF123..." value={formData.transportRequest.freeText} onChange={e => setFormData({...formData, transportRequest: {...formData.transportRequest, freeText: e.target.value}})} />
                </div>

                <div className="border-t pt-4">
                  <label className="block text-xs font-bold mb-2">Programme complet chauffeur</label>
                  <input type="file" ref={busProgramRef} className="hidden" onChange={(e) => handleFileUpload(e, true)} />
                  <button type="button" onClick={() => busProgramRef.current?.click()} className="text-xs py-2 px-4 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700">
                    {formData.transportRequest.busProgramFile ? "✅ Programme transport joint" : "📎 Joindre un programme PDF / Excel"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION RESTAURATION MODIFIÉE */}
          <button type="button" onClick={() => setShowPiqueNiqueModal(true)} className={`w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${formData.piqueNiqueDetails.active ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="text-left">
              <h3 className="font-bold text-slate-900">Commande Restauration (Cantine)</h3>
              <p className="text-xs text-slate-500">{formData.piqueNiqueDetails.active ? `✅ Commande configurée (${formData.piqueNiqueDetails.picnicTotal || 0} piques-niques)` : "Cliquer pour configurer le bon de commande cuisine"}</p>
            </div>
            <span className="text-xl">🥪</span>
          </button>
        </div>

        <div className="bg-white p-8 border rounded-3xl shadow-sm space-y-6">
          <div className="text-slate-400 uppercase text-xs font-bold tracking-widest border-b pb-4">5. Autres documents</div>
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

      {/* MODAL BUS RECAP */}
      {showBusRecapModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl border border-amber-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">🚌</div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">Vérification transport</h2>
                <p className="text-slate-500 text-sm font-medium">Récapitulatif de la demande chauffeur.</p>
              </div>
            </div>
            <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div><p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Destination</p><p className="font-bold text-slate-900">{formData.destination}</p></div>
                <div><p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Effectif</p><p className="font-bold text-slate-900">{Number(formData.nbEleves || 0) + Number(formData.nbAccompagnateurs || 0)} pers.</p></div>
                <div><p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Départ</p><p className="font-bold text-slate-900">{formData.startDate} à {formData.startTime}</p></div>
                <div><p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Retour</p><p className="font-bold text-slate-900">{formData.endDate} à {formData.endTime}</p></div>
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowBusRecapModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">MODIFIER</button>
              <button type="button" onClick={() => { setShowBusRecapModal(false); executeSubmit(); }} className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg">VALIDER ET ENVOYER</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CUISINE / PIQUE-NIQUE (PDF ALIGNED) */}
      {showPiqueNiqueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Bon de commande Cuisine</h2>
                <p className="text-slate-500 text-sm">Structure conforme au PDF du chef</p>
              </div>
              <button onClick={() => setShowPiqueNiqueModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
            </div>

            <div className="space-y-6">
              {/* Jours & Livraison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Heure Livraison</label>
                  <input type="time" className="w-full p-2 border rounded-lg" value={formData.piqueNiqueDetails.deliveryTime} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, deliveryTime: e.target.value, active: true}})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Lieu</label>
                  <select className="w-full p-2 border rounded-lg" value={formData.piqueNiqueDetails.deliveryPlace} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, deliveryPlace: e.target.value}})}>
                    <option value="Self">Self</option>
                    <option value="Bosco">Église Bosco</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 text-center">Jours concernés</label>
                  <div className="flex gap-1 justify-center">
                    {['L', 'M', 'Me', 'J', 'V'].map((d, i) => {
                      const dayKey = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'][i];
                      const isSelected = formData.piqueNiqueDetails.daysSelection[dayKey as keyof typeof formData.piqueNiqueDetails.daysSelection];
                      return (
                        <button key={d} type="button" 
                          onClick={() => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, daysSelection: {...formData.piqueNiqueDetails.daysSelection, [dayKey]: !isSelected}}})}
                          className={`w-7 h-7 rounded-md text-[10px] font-black transition-all ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-400'}`}>
                          {d}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Tableau Pique-Niques */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-indigo-600 uppercase border-b pb-1">Pique-Niques</p>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-[10px] font-bold">Nb Total</label><input type="number" className="w-full p-2 border rounded-lg" value={formData.piqueNiqueDetails.picnicTotal} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, picnicTotal: e.target.value, active: true}})} /></div>
                  <div><label className="text-[10px] font-bold">Sans Porc</label><input type="number" className="w-full p-2 border rounded-lg" value={formData.piqueNiqueDetails.picnicNoPork} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, picnicNoPork: e.target.value}})} /></div>
                  <div><label className="text-[10px] font-bold">Végétarien</label><input type="number" className="w-full p-2 border rounded-lg" value={formData.piqueNiqueDetails.picnicVeg} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, picnicVeg: e.target.value}})} /></div>
                </div>
              </div>

              {/* Tableau Self */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-indigo-600 uppercase border-b pb-1">Repas au Self</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold">Nb Adultes</label><input type="number" className="w-full p-2 border rounded-lg" value={formData.piqueNiqueDetails.selfAdults} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, selfAdults: e.target.value}})} /></div>
                  <div><label className="text-[10px] font-bold">Nb Élèves</label><input type="number" className="w-full p-2 border rounded-lg" value={formData.piqueNiqueDetails.selfStudents} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, selfStudents: e.target.value}})} /></div>
                </div>
              </div>

              {/* Pauses */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-indigo-600 uppercase border-b pb-1">Pauses & Suppléments</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-medium">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.piqueNiqueDetails.breakCoffee} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, breakCoffee: e.target.checked}})} /> Café/Thé</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.piqueNiqueDetails.breakJuice} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, breakJuice: e.target.checked}})} /> Jus</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.piqueNiqueDetails.breakCakes} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, breakCakes: e.target.checked}})} /> Gâteaux</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.piqueNiqueDetails.breakViennoiseries} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, breakViennoiseries: e.target.checked}})} /> Viennoiseries</label>
                </div>
                <input type="text" placeholder="Autre (précisez...)" className="w-full p-2 text-xs border rounded-lg mt-2" value={formData.piqueNiqueDetails.breakOther} onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, breakOther: e.target.value}})} />
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button type="button" onClick={() => { setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, active: false}}); setShowPiqueNiqueModal(false); }} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold">ANNULER LA COMMANDE</button>
              <button type="button" onClick={() => setShowPiqueNiqueModal(false)} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100">ENREGISTRER LE BON</button>
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
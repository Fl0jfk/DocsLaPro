"use client";

import { useUser } from "@clerk/nextjs";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";

function ComplexTripFormContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPiqueNiqueModal, setShowPiqueNiqueModal] = useState(false);

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
    // Logistique
    needsBus: false,
    pickupPoint: "",
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
    docs: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      programme: null as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listeEleves: null as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      devis: [] as any[]
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const tripId = `trip-${Date.now()}`; // Génère un ID unique basé sur le temps

  const payload = {
    id: tripId,
    ownerName: user?.fullName || "Professeur inconnu",
    ownerEmail: user?.primaryEmailAddress?.emailAddress,
    status: "EN_ATTENTE_DIRECTION",
    type: "COMPLEX",
    createdAt: new Date().toISOString(),
    data: formData
  };

  try {
    const res = await fetch("/api/travels/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: tripId,
        data: payload
      }),
    });

    if (res.ok) {
      router.push("/travels");
      router.refresh();
    } else {
      alert("Erreur lors de la sauvegarde.");
    }
  } catch (err) {
    console.error(err);
    alert("Impossible de contacter le serveur.");
  } finally {
    setLoading(false);
  }
};

  if (!isLoaded) return <div className="p-10 text-center font-medium">Chargement...</div>;

  return (
    <main className="max-w-5xl mx-auto p-8 pb-24">
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nouveau Voyage Scolaire</h1>
          <p className="text-slate-500 font-medium text-sm">Séjours, nuitées et projets pédagogiques complexes.</p>
        </div>
        <button onClick={() => router.back()} className="text-sm font-bold text-indigo-600 hover:underline">Annuler</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* 2. DATES & HORAIRES */}
        <div className="bg-white p-8 border rounded-3xl shadow-sm space-y-6">
        <div className="text-slate-400 uppercase text-xs font-bold tracking-widest border-b pb-4">2. Dates et Horaires</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
            <label className="block text-xs font-bold mb-1">Date Départ</label>
            <input type="date" required className="w-full p-3 bg-slate-50 border rounded-xl" 
                onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="md:col-span-2">
            <label className="block text-xs font-bold mb-1">Heure de RDV</label>
            <input type="time" required className="w-full p-3 bg-slate-50 border rounded-xl" 
                onChange={e => setFormData({...formData, startTime: e.target.value})} />
            </div>
            <div className="md:col-span-2">
            <label className="block text-xs font-bold mb-1">Date Retour</label>
            <input type="date" required className="w-full p-3 bg-slate-50 border rounded-xl" 
                onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
            <div className="md:col-span-2">
            <label className="block text-xs font-bold mb-1">Heure de retour prévue</label>
            <input type="time" required className="w-full p-3 bg-slate-50 border rounded-xl" 
                onChange={e => setFormData({...formData, endTime: e.target.value})} />
            </div>
        </div>
        </div>

        {/* 3. LOGISTIQUE & TRANSPORT AUTOMATISÉ */}
        <div className="bg-white p-8 border rounded-3xl shadow-sm space-y-6">
          <div className="text-slate-400 uppercase text-xs font-bold tracking-widest border-b pb-4">3. Logistique & Transport</div>
          
          {/* Toggle Bus */}
          <div className={`p-6 rounded-2xl border-2 transition-all ${formData.needsBus ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Demande de transport (Autocar)</h3>
                <p className="text-xs text-slate-500">Générer un devis automatique auprès des transporteurs.</p>
              </div>
              <input type="checkbox" className="w-6 h-6 accent-amber-600" onChange={e => setFormData({...formData, needsBus: e.target.checked})} />
            </div>
            {formData.needsBus && (
              <div className="mt-4 animate-in fade-in duration-300">
                <label className="block text-xs font-bold mb-1">Lieu de prise en charge (RDV)</label>
                <input className="w-full p-3 bg-white border rounded-xl" placeholder="Ex: Parking devant le gymnase" onChange={e => setFormData({...formData, pickupPoint: e.target.value})} />
              </div>
            )}
          </div>

          {/* Bouton Modal Pique-Nique */}
          <button 
            type="button"
            onClick={() => setShowPiqueNiqueModal(true)}
            className={`w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${formData.piqueNiqueDetails.active ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}
          >
            <div className="text-left">
              <h3 className="font-bold text-slate-900">Restauration (Pique-niques)</h3>
              <p className="text-xs text-slate-500">
                {formData.piqueNiqueDetails.active ? `✅ ${formData.piqueNiqueDetails.total} paniers demandés` : "Demander des repas à la cantine"}
              </p>
            </div>
            <span className="text-xl">🥪</span>
          </button>
        </div>

        {/* 4. DOCUMENTS OBLIGATOIRES */}
        <div className="bg-white p-8 border rounded-3xl shadow-sm space-y-6">
          <div className="text-slate-400 uppercase text-xs font-bold tracking-widest border-b pb-4">4. Pièces Jointes (Obligatoires)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-dashed rounded-2xl text-center hover:bg-slate-50 cursor-pointer">
              <span className="block text-xs font-bold text-slate-600">Détail du programme</span>
              <span className="text-[10px] text-slate-400">(PDF, Word)</span>
            </div>
            <div className="p-4 border-2 border-dashed rounded-2xl text-center hover:bg-slate-50 cursor-pointer">
              <span className="block text-xs font-bold text-slate-600">Liste des élèves</span>
              <span className="text-[10px] text-slate-400">(Excel, PDF)</span>
            </div>
            <div className="p-4 border-2 border-dashed rounded-2xl text-center hover:bg-slate-50 cursor-pointer">
              <span className="block text-xs font-bold text-slate-600">Autres Devis</span>
              <span className="text-[10px] text-slate-400">(Hébergement, visites...)</span>
            </div>
          </div>
        </div>

        <button disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all">
          {loading ? "Enregistrement..." : "Soumettre le dossier complet"}
        </button>
      </form>

      {/* MODAL PIQUE-NIQUE */}
      {showPiqueNiqueModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-2">Détail des pique-niques</h2>
            <p className="text-sm text-slate-500 mb-6">Ces informations seront transmises au chef de cuisine.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Nombre total de paniers</label>
                <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setFormData({...formData, piqueNiqueDetails: {...formData.piqueNiqueDetails, total: Number(e.target.value), active: true}})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-emerald-700">Végétariens</label>
                  <input type="number" className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-orange-700">Sans Porc</label>
                  <input type="number" className="w-full p-3 bg-orange-50 border border-orange-100 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Allergies connues</label>
                <textarea className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Précisez les noms et types d'allergies..." />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setShowPiqueNiqueModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Annuler</button>
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
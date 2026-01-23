"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SimpleTripFormContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);

  // État initial du formulaire avec le champ attachments
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    date: "",
    startTime: "", // Nouveau
    endTime: "",
    nbEleves: "",
    classes: "",
    nbAccompagnateurs: 1,
    nomsAccompagnateurs: "",
    coutTotal: 0,
    piqueNique: false,
    description: "",
    attachments: [] as { name: string; url: string }[]
  });

  // 1. Mode édition : récupération des données
  useEffect(() => {
    if (editId && isLoaded) {
      setFetching(true);
      fetch(`/api/travels/get?id=${editId}`)
        .then((res) => res.json())
        .then((trip) => {
          if (trip && trip.data) {
            // CORRECTION : On s'assure que attachments est au moins un tableau vide
            setFormData({
              ...trip.data,
              attachments: trip.data.attachments || []
            });
          }
          setFetching(false);
        })
        .catch((err) => {
          console.error("Erreur de récupération:", err);
          setFetching(false);
        });
    }
  }, [editId, isLoaded]);

  // 2. Logique d'upload de pièce jointe
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Demander l'URL présignée à l'API
      const res = await fetch('/api/travels/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      
      const { uploadUrl, fileUrl } = await res.json();

      // Upload direct sur S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      // Mise à jour de l'état (avec sécurité sur le spread)
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), { name: file.name, url: fileUrl }]
      }));

    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'envoi du fichier.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = (formData.attachments || []).filter((_, i) => i !== index);
    setFormData({ ...formData, attachments: updatedFiles });
  };

  if (!isLoaded || fetching) return <div className="p-10 text-center font-medium">Chargement du dossier...</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tripData = {
      id: editId || crypto.randomUUID(),
      ownerId: user?.id,
      ownerName: user?.fullName,
      ownerEmail: user?.primaryEmailAddress?.emailAddress,
      type: "SIMPLE",
      status: "PENDING_DIR_INITIAL",
      data: formData,
      updatedAt: new Date().toISOString(),
      createdAt: editId ? undefined : new Date().toISOString(),
      history: []
    };

    try {
      const response = await fetch('/api/travels/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tripData.id, data: tripData })
      });

      if (response.ok) {
        router.push("/travels");
        router.refresh();
      } else {
        alert("Erreur lors de la sauvegarde sur AWS");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {editId ? "Modifier la sortie" : "Nouvelle Sortie Simple"}
          </h1>
          <p className="text-slate-500 font-medium">Proximité, sans transport complexe ni nuitée.</p>
        </div>
        <button onClick={() => router.back()} className="text-sm font-bold text-indigo-600 hover:underline">
          Annuler
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 border rounded-3xl shadow-sm">
        
        {/* Section Générale */}
        <div className="md:col-span-2 space-y-4 border-b pb-4 text-slate-400 uppercase text-xs font-bold tracking-widest">
          Informations Générales
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2">Intitulé de la sortie</label>
          <input 
            required
            value={formData.title}
            className="w-full p-3 bg-slate-50 border rounded-xl outline-indigo-500"
            placeholder="Ex: Sortie Laser Game"
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2">Lieu et programme (Champ libre)</label>
          <textarea 
            required
            rows={2}
            value={formData.destination}
            className="w-full p-3 bg-slate-50 border rounded-xl outline-indigo-500"
            placeholder="Détails du lieu..."
            onChange={e => setFormData({...formData, destination: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Date de la sortie</label>
          <input 
            required
            type="date"
            value={formData.date}
            className="w-full p-3 bg-slate-50 border rounded-xl outline-indigo-500"
            onChange={e => setFormData({...formData, date: e.target.value})}
          />
        </div>
        <div>
        <label className="block text-sm font-semibold mb-2">Heure de départ</label>
        <input 
            required
            type="time"
            value={formData.startTime}
            className="w-full p-3 bg-slate-50 border rounded-xl outline-indigo-500"
            onChange={e => setFormData({...formData, startTime: e.target.value})}
        />
        </div>

        <div>
        <label className="block text-sm font-semibold mb-2">Heure de retour prévue</label>
        <input 
            required
            type="time"
            value={formData.endTime}
            className="w-full p-3 bg-slate-50 border rounded-xl outline-indigo-500"
            onChange={e => setFormData({...formData, endTime: e.target.value})}
        />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Coût total estimé (€)</label>
          <input 
            type="number"
            value={formData.coutTotal}
            className="w-full p-3 bg-slate-50 border rounded-xl outline-indigo-500"
            placeholder="0"
            onChange={e => setFormData({...formData, coutTotal: Number(e.target.value)})}
          />
        </div>

        {/* Section Participants */}
        <div className="md:col-span-2 space-y-4 border-b pb-4 mt-4 text-slate-400 uppercase text-xs font-bold tracking-widest">
          Participants & Encadrement
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Classes concernées</label>
          <input 
            value={formData.classes}
            className="w-full p-3 bg-slate-50 border rounded-xl outline-indigo-500"
            placeholder="Ex: 3A, 4B"
            onChange={e => setFormData({...formData, classes: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Nombre d'élèves total</label>
          <input 
            type="number"
            value={formData.nbEleves}
            className="w-full p-3 bg-slate-50 border rounded-xl outline-indigo-500"
            onChange={e => setFormData({...formData, nbEleves: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Nombre d'accompagnateurs</label>
          <input 
            type="number"
            value={formData.nbAccompagnateurs}
            className="w-full p-3 bg-slate-50 border rounded-xl outline-indigo-500"
            onChange={e => setFormData({...formData, nbAccompagnateurs: Number(e.target.value)})}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Noms des accompagnateurs</label>
          <input 
            value={formData.nomsAccompagnateurs}
            className="w-full p-3 bg-slate-50 border rounded-xl outline-indigo-500"
            placeholder="Mme Martin..."
            onChange={e => setFormData({...formData, nomsAccompagnateurs: e.target.value})}
          />
        </div>

        <div className="md:col-span-2 mt-4">
          <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
            <input 
              type="checkbox"
              id="pique"
              checked={formData.piqueNique}
              className="w-6 h-6 accent-orange-600"
              onChange={e => setFormData({...formData, piqueNique: e.target.checked})}
            />
            <label htmlFor="pique" className="text-sm font-medium text-orange-900 cursor-pointer">
              Besoin de pique-niques fournis par la cantine ?
            </label>
          </div>
        </div>

        {/* NOUVELLE SECTION : PIÈCES JOINTES */}
        <div className="md:col-span-2 space-y-4 border-t pt-8 mt-4">
          <label className="block text-sm font-bold text-slate-700">Pièces jointes (Devis, Programme...)</label>
          
          <div className="flex flex-wrap gap-4">
            {/* CORRECTION : Optionnel chaining pour éviter l'erreur sur les anciens dossiers */}
            {formData.attachments?.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 text-sm font-medium">
                <span className="truncate max-w-[200px]">📄 {file.name}</span>
                <button type="button" onClick={() => removeFile(idx)} className="text-indigo-400 hover:text-indigo-600 ml-2">✕</button>
              </div>
            ))}

            <label className="cursor-pointer flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 hover:bg-slate-50 transition-all w-full md:w-auto min-w-[200px]">
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              <span className="text-slate-500 text-sm font-medium text-center">
                {uploading ? "Envoi en cours..." : "+ Ajouter un document (PDF, Image)"}
              </span>
            </label>
          </div>
        </div>

        <div className="md:col-span-2 mt-8">
          <button 
            type="submit"
            disabled={loading || uploading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
          >
            {loading ? "Enregistrement en cours..." : (editId ? "Mettre à jour la demande" : "Soumettre la demande")}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function SimpleTripForm() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SimpleTripFormContent />
    </Suspense>
  );
}
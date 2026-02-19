"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TripDetails() {
  const { id } = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isLoaded: isUserLoaded } = useUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trip, setTrip] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const rawRoles = user?.publicMetadata?.role;
  const userRoles = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];
  const isDirectionLycee = userRoles.includes('direction_lycee');
  const isDirectionCollege = userRoles.includes('direction collège');
  const isDirectionEcole = userRoles.includes('direction école');
  const isDirection = isDirectionLycee || isDirectionCollege || isDirectionEcole;
  
  const isCompta = userRoles.includes('comptabilité');
  const isOwner = user?.fullName === trip?.ownerName;
  
  const canManageFiles = isOwner || isDirection || isCompta;

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/travels/get?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setTrip(data);
          setEditedData(data.data);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du dossier:", err);
      }
    };
    if (id) fetchTrip();
  }, [id]);

  const openSecureFile = async (fileUrl: string) => {
    try {
      const res = await fetch('/api/travels/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl })
      });
      const { signedUrl } = await res.json();
      if (signedUrl) window.open(signedUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ouverture du fichier.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canManageFiles) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
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
      const newAttachment = { name: file.name, url: fileUrl };
      if (isEditing) {
        setEditedData((prev: any) => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      } else {
        const updatedTrip = {
          ...trip,
          data: {
            ...trip.data,
            attachments: [...(trip.data.attachments || []), newAttachment]
          }
        };
        await saveUpdates(updatedTrip);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'envoi du fichier.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (index: number) => {
    if (!canManageFiles) return;
    if (isEditing) {
      const updatedFiles = (editedData.attachments || []).filter((_: any, i: number) => i !== index);
      setEditedData({ ...editedData, attachments: updatedFiles });
    } else {
      const updatedFiles = (trip.data.attachments || []).filter((_: any, i: number) => i !== index);
      const updatedTrip = {
        ...trip,
        data: { ...trip.data, attachments: updatedFiles }
      };
      await saveUpdates(updatedTrip);
    }
  };

  const saveUpdates = async (updatedTrip: any) => {
    try {
      const res = await fetch('/api/travels/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trip.id, data: updatedTrip })
      });
      if (res.ok) setTrip(updatedTrip);
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
    }
  };

  const handleAction = async (newStatus: string, note: string = "", extraData: any = null) => {
    setLoadingAction(true);
    const finalData = isEditing ? editedData : (extraData ? { ...trip.data, ...extraData } : trip.data);
    
    const updatedTrip = {
      ...trip,
      status: newStatus,
      data: finalData,
      history: [
        ...(trip.history || []),
        {
          date: new Date().toISOString(),
          user: user?.fullName,
          action: newStatus,
          note: note
        }
      ]
    };
    await saveUpdates(updatedTrip);
    setIsEditing(false);
    setLoadingAction(false);
  };

  const selectBusQuote = async (quote: any) => {
    if (!confirm(`Confirmer le choix de ${quote.providerName} ? Cela informera la direction pour signature.`)) return;
    
    const updatedTrip = {
      ...trip,
      status: "PENDING_BUS_SIGNATURE",
      data: { 
        ...trip.data, 
        selectedBusQuote: quote,
      },
    };
    await saveUpdates(updatedTrip);
  };

  const signBusQuote = async () => {
    if (!confirm("Voulez-vous signer le devis et envoyer la commande au transporteur ?")) return;
    const transporteurEmail = trip.data.selectedBusQuote?.email || trip.data.selectedBusQuote?.providerEmail;
    if (!transporteurEmail) {
      alert("Erreur : Impossible de trouver l'adresse email du transporteur.");
      return;
    }
    setLoadingAction(true);
    let sigType = "";
    if (userRoles.includes('direction école')) sigType = "ecole";
    else if (userRoles.includes('direction collège')) sigType = "college";
    else if (userRoles.includes('direction_lycee')) sigType = "lycee";

    if (!sigType) {
      alert("Erreur de rôle.");
      setLoadingAction(false);
      return;
    }

    try {
      console.log("1. Demande de signature PDF...");
      const signRes = await fetch('/api/travels/sign-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quoteUrl: trip.data.selectedBusQuote.fileUrl, 
          signatureType: sigType 
        })
      });

      if (!signRes.ok) throw new Error("Erreur lors de la signature PDF");
      const { signedPdfData } = await signRes.json();
      console.log("2. PDF signé reçu (base64)");
      const base64Content = signedPdfData.split(',')[1];
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      console.log("3. Demande d'URL d'upload...");
      const fileName = `Devis_Signe_${trip.data.selectedBusQuote.providerName.replace(/\s+/g, '_')}.pdf`;
      const uploadRes = await fetch('/api/travels/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileType: "application/pdf" })
      });
      
      const { uploadUrl, fileUrl } = await uploadRes.json();

      console.log("4. Upload vers S3...");
      await fetch(uploadUrl, { 
        method: 'PUT', 
        body: blob, 
        headers: { 'Content-Type': 'application/pdf' } 
      });

      console.log("5. Envoi du mail au transporteur...");
      await fetch('/api/travels/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          tripTitle: trip.data.title,
          providerEmail: transporteurEmail,
          signedQuoteUrl: fileUrl,
          providerName: trip.data.selectedBusQuote.providerName
        })
      });

      const newAttachment = { name: `✅ ${fileName}`, url: fileUrl };
      const extraData = {
        attachments: [...(trip.data.attachments || []), newAttachment],
        signedQuoteUrl: fileUrl
      };

      console.log("6. Mise à jour du statut du dossier...");
      handleAction("PENDING_COMPTA", `Devis signé (${sigType}) et commande envoyée à ${trip.data.selectedBusQuote.providerName}`, extraData);
      
      alert("Succès : Devis signé et envoyé !");

    } catch (err: any) {
      console.error("Erreur complète:", err);
      alert("Erreur lors du processus : " + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const formatSafeDate = (dateStr: any) => {
    if (!dateStr) return "N/C";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Date à préciser" : d.toLocaleDateString('fr-FR');
  };

  if (!isUserLoaded || !trip) return <p className="p-10 text-center font-medium text-slate-500">Chargement du dossier...</p>;

  const currentSteps = trip.type === "COMPLEX" 
    ? [
        { n: "1", label: "Pédagogie", key: "PENDING_DIR_INITIAL" }, 
        { n: "2", label: "Logistique", key: "PROF_LOGISTICS" },
        { n: "3", label: "Finances", key: "PENDING_COMPTA" }, 
        { n: "4", label: "Validation", key: "PENDING_DIR_FINAL" }, 
        { n: "5", label: "Finalisé", key: "VALIDATED" }
      ]
    : [
        { n: "1", label: "Pédagogie", key: "PENDING_DIR_INITIAL" }, 
        { n: "2", label: "Finances", key: "PENDING_COMPTA" }, 
        { n: "3", label: "Finalisé", key: "VALIDATED" }
      ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {trip.status === "NEED_MODIFICATION" && !isEditing && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-left">
            <span className="text-3xl">⚠️</span>
            <div>
              <p className="font-bold text-orange-900">Action requise : Modifications demandées</p>
              <p className="text-orange-700 text-sm">Seul le créateur du projet peut modifier ces informations.</p>
            </div>
          </div>
          {isOwner && (
            <button onClick={() => setIsEditing(true)} className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-all active:scale-95">
              Modifier mon dossier
            </button>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        <button onClick={() => router.push('/travels')} className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-2xl font-bold transition-all active:scale-95">
          ← Retour
        </button>

        {isEditing && (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-2xl font-bold">Annuler</button>
            <button 
              onClick={() => handleAction("PENDING_DIR_INITIAL", "Modifications effectuées")}
              disabled={uploading}
              className="bg-green-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg disabled:opacity-50"
            >
              {uploading ? "Envoi..." : "✅ Enregistrer et Renvoyer"}
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-start border-b pb-6 text-left">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{trip.data.title}</h1>
          <p className="text-slate-500 mt-1 uppercase text-xs font-black tracking-tighter">
            {trip.type === "COMPLEX" ? "📁 Dossier Voyage Complexe" : "📄 Sortie Simple"} • Par {trip.ownerName}
          </p>
        </div>
        <div className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider ${trip.status === "NEED_MODIFICATION" ? "bg-orange-100 text-orange-700 animate-pulse" : "bg-indigo-100 text-indigo-700"}`}>
          {trip.status}
        </div>
      </div>

      <div className={`grid gap-4 text-center ${trip.type === "COMPLEX" ? "grid-cols-5" : "grid-cols-3"}`}>
        {currentSteps.map((s) => (
          <Step key={s.n} label={s.label} active={trip.status === s.key || (s.key === "VALIDATED" && trip.status === "VALIDATED") || (trip.status === "PENDING_BUS_SIGNATURE" && s.key === "PROF_LOGISTICS")} step={s.n} />
        ))}
      </div>

      {trip.data.needsBus && trip.type === "COMPLEX" && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">🚌 Gestion des devis Transport</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-bold text-amber-700 uppercase">Offres déposées :</p>
              {trip.receivedDevis && trip.receivedDevis.length > 0 ? (
                trip.receivedDevis.map((quote: any, idx: number) => (
                  <div key={idx} className={`p-4 rounded-2xl border-2 flex justify-between items-center ${trip.data.selectedBusQuote?.fileUrl === quote.fileUrl ? 'border-green-500 bg-white shadow-md' : 'border-white bg-white/50'}`}>
                    <div className="text-left">
                      <p className="font-bold text-slate-800">{quote.providerName}</p>
                      <p className="text-indigo-600 font-black text-xs italic">Devis reçu</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => window.open(quote.fileUrl, '_blank')} className="text-[10px] font-bold text-slate-500 underline">Voir PDF</button>
                      {isOwner && trip.status === "PROF_LOGISTICS" && (
                        <button onClick={() => selectBusQuote(quote)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">Choisir</button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">En attente de devis via le lien public...</p>
              )}
            </div>

            <div className="bg-white/60 rounded-2xl p-6 border border-amber-200 flex flex-col justify-center items-center text-center">
              {trip.data.selectedBusQuote ? (
                <>
                  <p className="text-sm text-amber-900 mb-2 font-bold">Devis sélectionné : {trip.data.selectedBusQuote.providerName}</p>
                  {isDirection && trip.status === "PENDING_BUS_SIGNATURE" && (
                    <div className="flex flex-col gap-3 w-full">
                       <button onClick={signBusQuote} disabled={loadingAction} className="bg-green-600 text-white px-6 py-4 rounded-xl font-bold shadow-xl hover:scale-105 transition-all disabled:opacity-50">
                        ✍️ Signer & Commander
                      </button>
                      <button onClick={() => { const n = prompt("Pourquoi refusez-vous ce devis ?"); if(n) handleAction("PROF_LOGISTICS", n); }} className="text-xs font-bold text-red-600 underline">
                        Refuser ce choix
                      </button>
                    </div>
                  )}
                  {(trip.status === "PENDING_COMPTA" || trip.status === "PENDING_DIR_FINAL" || trip.status === "VALIDATED") && <p className="text-green-600 font-bold flex items-center gap-2 text-sm">✅ Commandé & Signé</p>}
                </>
              ) : (
                <p className="text-sm text-slate-400 italic font-medium">Le créateur sélectionnera un devis à l'étape Logistique.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm text-left">
        <h2 className="text-xl font-bold mb-6 text-slate-800">Informations Logistiques</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <DetailItem label="Destination" value={trip.data.destination} />
          <EditableDetail isEditing={isEditing} label="Classes concernées" value={isEditing ? editedData.classes : trip.data.classes} onChange={(v) => setEditedData({...editedData, classes: v})} />

          <div className="flex flex-col border-b border-slate-50 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Effectifs</span>
            {isEditing ? (
              <div className="flex gap-4">
                <div className="flex flex-col"><span className="text-[9px]">Élèves</span><input type="number" className="border rounded p-1 w-20" value={editedData.nbEleves} onChange={(e) => setEditedData({...editedData, nbEleves: e.target.value})} /></div>
                <div className="flex flex-col"><span className="text-[9px]">Accomp.</span><input type="number" className="border rounded p-1 w-20" value={editedData.nbAccompagnateurs} onChange={(e) => setEditedData({...editedData, nbAccompagnateurs: Number(e.target.value)})} /></div>
              </div>
            ) : (
              <span className="text-slate-700 font-medium">{trip.data.nbEleves} élèves | {trip.data.nbAccompagnateurs || "0"} accompagnateurs</span>
            )}
          </div>

          <EditableDetail isEditing={isEditing} label="Noms des accompagnateurs" value={isEditing ? editedData.nomsAccompagnateurs : trip.data.nomsAccompagnateurs} onChange={(v) => setEditedData({...editedData, nomsAccompagnateurs: v})} />

          <div className="flex flex-col border-b border-slate-50 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dates</span>
            {isEditing ? (
              <div className="flex gap-2">
                <input type="date" className="text-sm border p-1 rounded" value={editedData.startDate || editedData.date || ""} onChange={(e) => setEditedData({...editedData, startDate: e.target.value, date: e.target.value})} />
                {trip.type === "COMPLEX" && <input type="date" className="text-sm border p-1 rounded" value={editedData.endDate || ""} onChange={(e) => setEditedData({...editedData, endDate: e.target.value})} />}
              </div>
            ) : (
              <span className="text-slate-700 font-medium">{trip.type === "COMPLEX" ? `Du ${formatSafeDate(trip.data.startDate)} au ${formatSafeDate(trip.data.endDate)}` : `Le ${formatSafeDate(trip.data.date)}`}</span>
            )}
          </div>

          <div className="flex flex-col border-b border-slate-50 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Horaires</span>
            {isEditing ? (
              <div className="flex gap-2">
                <input type="text" className="text-sm border p-1 rounded w-24" placeholder="Départ" value={editedData.startTime} onChange={(e) => setEditedData({...editedData, startTime: e.target.value})} />
                <input type="text" className="text-sm border p-1 rounded w-24" placeholder="Retour" value={editedData.endTime} onChange={(e) => setEditedData({...editedData, endTime: e.target.value})} />
              </div>
            ) : (
              <span className="text-slate-700 font-medium">{`Départ: ${trip.data.startTime} | Retour: ${trip.data.endTime}`}</span>
            )}
          </div>

          <div className="flex flex-col border-b border-slate-50 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Budget prévisionnel</span>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input type="number" className="text-sm border p-1 rounded w-32" value={editedData.coutTotal} onChange={(e) => setEditedData({...editedData, coutTotal: Number(e.target.value)})} />
                <span className="text-slate-600 font-bold text-xs uppercase">€ Total</span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-slate-700 font-medium">{Math.round(Number(trip.data.coutTotal))} € (Total prévisionnel)</span>
                {trip.data.finalTotalCost && (
                  <span className="text-green-600 font-bold text-sm">Validé Compta : {trip.data.finalTotalCost} € ({trip.data.costPerStudent} €/élève)</span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col border-b border-slate-50 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Restauration</span>
            {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                    <input type="checkbox" checked={editedData.piqueNique} onChange={(e) => setEditedData({...editedData, piqueNique: e.target.checked})} />
                    <span className="text-sm font-medium text-slate-700">Pique-nique à prévoir</span>
                </div>
            ) : (
                <span className="text-slate-700 font-medium">{trip.data.piqueNique ? "🥪 Pique-nique à prévoir" : "🍴 Pas de pique-nique"}</span>
            )}
          </div>

          <div className="md:col-span-2 flex flex-col border-b border-slate-50 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Objectifs pédagogiques</span>
            {isEditing ? (
              <textarea 
                className="text-sm border p-2 rounded w-full mt-2 min-h-[80px]" 
                value={editedData.objectifs} 
                onChange={(e) => setEditedData({...editedData, objectifs: e.target.value})}
              />
            ) : (
              <p className="text-slate-700 font-medium mt-1 text-sm leading-relaxed">{trip.data.objectifs || "Aucun objectif renseigné."}</p>
            )}
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Documents et Devis</span>
              {canManageFiles && (
                <>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-bold border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50">
                    {uploading ? "Upload..." : "+ Ajouter un document"}
                  </button>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {(isEditing ? editedData.attachments : trip.data.attachments)?.map((file: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border rounded-xl text-xs font-semibold text-indigo-600 shadow-sm">
                  <button type="button" onClick={() => openSecureFile(file.url)} className="hover:underline">📄 {file.name}</button>
                  {canManageFiles && (
                    <button type="button" onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-600 px-1 font-bold text-[10px]">✕</button>
                  )}
                </div>
              )) || <span className="text-xs text-slate-400 italic">Aucune pièce jointe.</span>}
            </div>
          </div>
        </div>
      </div>

      {(isDirection || isCompta) && !isEditing && trip.status !== "NEED_MODIFICATION" && (
        <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
          <div className="text-center md:text-left">
            <p className="font-bold text-lg">Espace Décisionnaire</p>
            <p className="text-slate-400 text-sm italic">{isCompta ? "Comptabilité" : "Direction"}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {((isDirection && (trip.status === 'PENDING_DIR_INITIAL' || trip.status === 'PENDING_BUS_SIGNATURE' || trip.status === 'PENDING_DIR_FINAL')) || (isCompta && trip.status === 'PENDING_COMPTA')) && (
              <>
                <ActionButton label="Refus Définitif" color="bg-red-600" onClick={() => { const n = prompt("Motif du refus définitif :"); if(n) handleAction("REJECTED", n); }} />
                <ActionButton label="Demander Modifs" color="bg-orange-500" onClick={() => { const n = prompt("Précisez les changements attendus :"); if(n) handleAction("NEED_MODIFICATION", n); }} />
              </>
            )}

            {isDirection && trip.status === 'PENDING_DIR_INITIAL' && (
              <ActionButton label="Valider Pédagogie" color="bg-indigo-600" onClick={() => handleAction(trip.type === "COMPLEX" ? "PROF_LOGISTICS" : "PENDING_COMPTA", "Pédagogie validée")} />
            )}

            {isCompta && trip.status === 'PENDING_COMPTA' && (
              <ActionButton label="Valider Budget Global" color="bg-green-600" onClick={() => { 
                const total = prompt("Montant GLOBAL final (€) :");
                if(total) {
                  const student = prompt("Coût par ÉLÈVE final (€) :");
                  if(student) handleAction("PENDING_DIR_FINAL", "Budget validé", { finalTotalCost: total, costPerStudent: student });
                }
              }} />
            )}

            {isDirection && trip.status === 'PENDING_DIR_FINAL' && (
              <ActionButton label="Validation Finale Dossier" color="bg-green-600" onClick={() => handleAction("VALIDATED", "Dossier validé par la Direction")} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ label, active, step }: { label: string, active: boolean, step: string }) {
  return (
    <div className={`p-4 rounded-2xl border-2 transition-all ${active ? 'border-indigo-500 bg-indigo-50 scale-105 shadow-sm' : 'border-slate-100 opacity-50'}`}>
      <p className="text-[10px] font-bold uppercase text-indigo-600 text-left">Étape {step}</p>
      <p className="font-bold text-slate-800 text-xs text-left">{label}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col border-b border-slate-50 pb-2 text-left">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-slate-700 font-medium truncate">{value || "—"}</span>
    </div>
  );
}

function EditableDetail({ isEditing, label, value, onChange, type = "text" }: { isEditing: boolean, label: string, value: any, onChange: (v: string) => void, type?: string }) {
  return (
    <div className="flex flex-col border-b border-slate-50 pb-2 text-left">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      {isEditing ? (
        <input type={type} className="text-sm border-b-2 border-indigo-300 outline-none bg-indigo-50 px-1 font-medium text-slate-700 w-full" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <span className="text-slate-700 font-medium">{value || "—"}</span>
      )}
    </div>
  );
}

function ActionButton({ label, color, onClick }: { label: string, color: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`${color} px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-transform`}>
      {label}
    </button>
  );
}
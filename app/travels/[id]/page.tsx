"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TripDetails() {
  const { id } = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isLoaded: isUserLoaded } = useUser();
  const [trip, setTrip] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const rawRoles = user?.publicMetadata?.role;
  const userRoles = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];
  const isDirectionLycee = userRoles.includes('direction_lycee');
  const isDirectionCollege = userRoles.includes('direction collège');
  const isDirectionEcole = userRoles.includes('direction école');
  const isDirection = isDirectionLycee || isDirectionCollege || isDirectionEcole;

  // Returns true if the currently logged-in director is allowed to sign for this trip's établissement.
  // École → direction école only · Collège → direction collège only
  // Lycée or unset/multi → direction lycée only (coordinator of the whole group)
  const etabForSign = trip?.data?.etablissement || "";
  // Normalise for accent/case-insensitive role comparison
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_\s-]+/g, "");
  const isEcoleDir  = userRoles.some((r: string) => norm(r).includes("directionecole")  || norm(r).includes("directionecol") || (norm(r).includes("direction") && norm(r).includes("ecole")));
  const isCollegeDir = userRoles.some((r: string) => norm(r).includes("directioncollege") || (norm(r).includes("direction") && norm(r).includes("college")));
  const isLyceeDir  = userRoles.some((r: string) => norm(r).includes("directionlycee")  || (norm(r).includes("direction") && norm(r).includes("lycee")));
  const canSign = etabForSign === "École" ? (isDirectionEcole  || isEcoleDir)
    : etabForSign === "Collège"            ? (isDirectionCollege || isCollegeDir)
    : etabForSign === "Lycée"              ? (isDirectionLycee  || isLyceeDir)
    : isDirectionLycee || isLyceeDir; // Groupe Scolaire / unset → lycée coordinator
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
    // Safari is stricter about popups: if `window.open` happens after an `await`,
    // it may be blocked. We open a blank tab immediately, then redirect it.
    const newWindow = window.open("", "_blank");
    try {
      const res = await fetch('/api/travels/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl })
      });
      const { signedUrl } = await res.json();
      if (!signedUrl) throw new Error("Lien signé manquant");

      if (newWindow) {
        newWindow.location.href = signedUrl;
        newWindow.focus();
      } else {
        // Popup blocked: fallback to current tab navigation.
        window.location.href = signedUrl;
      }
    } catch (err) {
      console.error(err);
      if (newWindow) newWindow.close();
      alert("Erreur lors de l'ouverture du fichier.");
    }
  };

  const saveUpdates = async (updatedTrip: any) => {
    try {
      const res = await fetch('/api/travels/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trip.id, data: updatedTrip })
      });
      if (res.ok) {
        setTrip(updatedTrip);
        setEditedData(updatedTrip.data);
      }
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
    }
  };

  const handleFinalValidation = async () => {
    if (!canSign) return alert("Vous n'êtes pas autorisé(e) à valider ce dossier.");
    setLoadingAction("circular");
    try {
      let finalAttachments = [...(trip.data.attachments || [])];
      
      // 1. Génération Circulaire
      const circRes = await fetch('/api/travels/generate-circular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripData: trip })
      });
      
      if (circRes.ok) {
        const { pdf } = await circRes.json();
        const fileName = `Circulaire_${trip.data.title.replace(/\s+/g, '_')}.pdf`;
        
        const uploadRes = await fetch('/api/travels/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName, fileType: "application/pdf" })
        });
        
        const { uploadUrl, fileUrl } = await uploadRes.json();
        const base64Content = pdf.split(',')[1];
        const byteArray = new Uint8Array(atob(base64Content).split("").map(c => c.charCodeAt(0)));
        await fetch(uploadUrl, { method: 'PUT', body: new Blob([byteArray], { type: 'application/pdf' }) });
        
        finalAttachments.push({ name: `📄 Circulaire Parents`, url: fileUrl });
      }

      // 2. Cuisine
      if (trip.data.piqueNiqueDetails?.active) {
        await fetch('/api/travels/send-cuisine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tripData: trip, 
            userEmail: user?.primaryEmailAddress?.emailAddress,
            userName: trip.ownerName 
          })
        });
      }

      // 3. Valider définitivement le dossier
      await handleAction("VALIDATED", "Dossier validé. Circulaire générée et commande cuisine envoyée.", { attachments: finalAttachments });
      alert("Dossier validé ! La circulaire a été ajoutée aux documents.");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la validation finale.");
    } finally {
      setLoadingAction(null);
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
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      const newAttachment = { name: file.name, url: fileUrl };
      const currentAttachments = isEditing ? (editedData.attachments || []) : (trip.data.attachments || []);
      const updatedAttachments = [...currentAttachments, newAttachment];
      
      if (isEditing) {
        setEditedData((prev: any) => ({ ...prev, attachments: updatedAttachments }));
      } else {
        const updatedTrip = { ...trip, data: { ...trip.data, attachments: updatedAttachments } };
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
    const currentAttachments = isEditing ? (editedData.attachments || []) : (trip.data.attachments || []);
    const updatedFiles = currentAttachments.filter((_: any, i: number) => i !== index);
    if (isEditing) {
      setEditedData({ ...editedData, attachments: updatedFiles });
    } else {
      const updatedTrip = { ...trip, data: { ...trip.data, attachments: updatedFiles } };
      await saveUpdates(updatedTrip);
    }
  };

  const handleAction = async (newStatus: string, note: string = "", extraData: any = null) => {
    if (!loadingAction) setLoadingAction("action");
    const baseData = isEditing ? { ...trip.data, ...editedData } : trip.data;
    const finalData = extraData ? { ...baseData, ...extraData } : baseData;
    const updatedTrip = {
      ...trip,
      status: newStatus,
      data: finalData,
      history: [
        ...(trip.history || []),
        { date: new Date().toISOString(), user: user?.fullName, action: newStatus, note: note }
      ]
    };
    await saveUpdates(updatedTrip);
    setIsEditing(false);
    setLoadingAction(null);
  };

  const selectBusQuote = async (quote: any) => {
    if (!confirm(`Confirmer le choix de ${quote.providerName} ? Cela informera la direction pour signature.`)) return;
    const updatedTrip = { ...trip, status: "PENDING_BUS_SIGNATURE", data: { ...trip.data, selectedBusQuote: quote } };
    await saveUpdates(updatedTrip);
  };

  const signBusQuote = async () => {
    if (!canSign) return alert("Vous n'êtes pas autorisé(e) à signer ce dossier.");
    if (!confirm("Voulez-vous signer le devis et envoyer la commande au transporteur ?")) return;
    const transporteurEmail = trip.data.selectedBusQuote?.email || trip.data.selectedBusQuote?.providerEmail;
    if (!transporteurEmail) return alert("Erreur : Email transporteur introuvable.");
    
    setLoadingAction("signing");
    // Determine signature from the trip's établissement field.
    // If multiple classes / no etablissement → lycée director signs as group coordinator.
    const etab = trip.data?.etablissement || "";
    let sigType = etab === "École" ? "ecole" : etab === "Collège" ? "college" : "lycee";
    if (!sigType) return alert("Erreur de rôle.");

    try {
      const signRes = await fetch('/api/travels/sign-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteUrl: trip.data.selectedBusQuote.fileUrl, signatureType: sigType })
      });
      const { signedPdfData } = await signRes.json();
      const fileName = `Devis_Signe_${trip.data.selectedBusQuote.providerName.replace(/\s+/g, '_')}.pdf`;
      const uploadRes = await fetch('/api/travels/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileType: "application/pdf" })
      });
      const { uploadUrl, fileUrl } = await uploadRes.json();
      const byteArray = new Uint8Array(atob(signedPdfData.split(',')[1]).split("").map(c => c.charCodeAt(0)));
      await fetch(uploadUrl, { method: 'PUT', body: new Blob([byteArray], { type: 'application/pdf' }) });

      await fetch('/api/travels/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          tripTitle: trip.data.title,
          tripData: trip.data,
          providerEmail: transporteurEmail,
          signedQuoteUrl: fileUrl,
          providerName: trip.data.selectedBusQuote.providerName,
        })
      });

      const newAttachment = { name: `✅ ${fileName}`, url: fileUrl };
      handleAction("PENDING_COMPTA", `Devis signé et commande envoyée`, { attachments: [...(trip.data.attachments || []), newAttachment], signedQuoteUrl: fileUrl });
    } catch (err) {
      alert("Erreur lors de la signature.");
    } finally {
      setLoadingAction(null);
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
        { n: "3", label: "Validation", key: "PENDING_DIR_FINAL" }, 
        { n: "4", label: "Finalisé", key: "VALIDATED" }
      ];

  return (
    <div className="relative max-w-5xl mx-auto p-6 space-y-8">
      
      {/* LOADING OVERLAY */}
      {loadingAction && (
        <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="relative flex justify-center">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <span className="absolute inset-0 flex items-center justify-center text-xl">
                {loadingAction === "circular" ? "📄" : loadingAction === "signing" ? "✍️" : "⏳"}
              </span>
            </div>
            {loadingAction === "circular" ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Génération de la circulaire</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Analyse des documents en cours. Cela peut prendre <strong>une dizaine de secondes</strong>.
                    <br /><br />
                    <span className="text-indigo-600 font-semibold italic">Merci de ne pas quitter cette page.</span>
                  </p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-2xl">
                  <p className="text-[11px] text-indigo-700 font-medium">
                    💡 Une fois terminé, le document se trouvera dans les pièces du dossier sous le nom <strong>"Circulaire Parents"</strong>.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  {loadingAction === "signing" ? "Signature en cours…" : "Traitement en cours…"}
                </h3>
                <p className="text-slate-500 text-sm">Merci de patienter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {trip.status === "NEED_MODIFICATION" && !isEditing && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-left">
            <span className="text-3xl">⚠️</span>
            <div>
              <p className="font-bold text-orange-900">Action requise : Modifications demandées</p>
              <p className="text-orange-700 text-sm italic">"{trip.history?.[trip.history.length - 1]?.note}"</p>
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
              onClick={() => handleAction(trip.data.previousStatus || "PENDING_DIR_INITIAL", "Modifications effectuées")}
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
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 space-y-6 text-left">
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
                      {canSign ? (
                        <button onClick={signBusQuote} disabled={!!loadingAction} className="bg-green-600 text-white px-6 py-4 rounded-xl font-bold shadow-xl hover:scale-105 transition-all disabled:opacity-50">
                          ✍️ Signer & Commander
                        </button>
                      ) : (
                        <div className="bg-amber-100 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800 text-left">
                          <p className="font-bold mb-1">Signature réservée</p>
                          <p>Ce dossier concerne l&apos;<strong>{etabForSign || "ensemble du groupe"}</strong>. Seule la direction de cet établissement peut signer.</p>
                        </div>
                      )}
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
                <div className="flex flex-col gap-1">
                  <span className="text-slate-700 font-medium">{trip.data.piqueNiqueDetails?.active ? "🥪 Commande cuisine configurée" : "🍴 Pas de commande cuisine"}</span>
                  {trip.data.piqueNiqueDetails?.active && (
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
                      {Object.values(trip.data.piqueNiqueDetails.daysSelection || {}).filter(Boolean).length} jour(s) — {trip.data.piqueNiqueDetails.deliveryPlace || "Self"} à {trip.data.piqueNiqueDetails.deliveryTime || "—"}
                    </span>
                  )}
                </div>
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
              ))}
            </div>
          </div>
        </div>
      </div>

      {(isDirection || isCompta) && !isEditing && trip.status !== "NEED_MODIFICATION" && (
        <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl text-left">
          <div className="text-center md:text-left">
            <p className="font-bold text-lg">Espace Décisionnaire</p>
            <p className="text-slate-400 text-sm italic">{isCompta ? "Comptabilité" : "Direction"}</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Direction membre mais pas le bon établissement → message d'information */}
            {isDirection && !canSign && (
              <div className="bg-slate-800 border border-slate-600 rounded-2xl px-5 py-3 text-sm text-slate-300 max-w-xs text-left">
                <p className="font-bold text-white mb-0.5">Accès en lecture seule</p>
                <p>Ce dossier concerne <span className="font-semibold text-amber-300">{etabForSign || "le groupe scolaire"}</span>. Seule la direction de cet établissement peut valider ou rejeter.</p>
              </div>
            )}

            {/* Actions disponibles uniquement pour la bonne direction */}
            {((canSign && (trip.status === 'PENDING_DIR_INITIAL' || trip.status === 'PENDING_BUS_SIGNATURE' || trip.status === 'PENDING_DIR_FINAL')) || (isCompta && trip.status === 'PENDING_COMPTA')) && (
              <>
                {canSign && (
                  <ActionButton label="Refus Définitif" color="bg-red-600" onClick={() => { const n = prompt("Motif du refus définitif :"); if(n) handleAction("REJECTED", n); }} />
                )}
                <ActionButton label="Demander Modifs" color="bg-orange-500" onClick={() => {
                  const n = prompt("Précisez les changements attendus :");
                  if(n) {
                    const returnTo = trip.status === "PENDING_DIR_FINAL" ? "PENDING_COMPTA" : trip.status;
                    handleAction("NEED_MODIFICATION", n, { previousStatus: returnTo });
                  }
                }} />
              </>
            )}
            {canSign && trip.status === 'PENDING_DIR_INITIAL' && (
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
            {canSign && trip.status === 'PENDING_DIR_FINAL' && (
              <ActionButton
                label={loadingAction ? "Finalisation..." : "Validation Finale Dossier"}
                color="bg-green-600"
                onClick={handleFinalValidation}
              />
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
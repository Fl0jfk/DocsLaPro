"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TripDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trip, setTrip] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  console.log(loadingAction)
  const rawRoles = user?.publicMetadata?.role;
  const userRoles = Array.isArray(rawRoles) ? rawRoles : rawRoles  ? [rawRoles] : [];
  const isDirection = userRoles.some(r => ['direction école', 'direction collège', 'direction_lycee'].includes(r));
  const isCompta = userRoles.includes('comptabilité');
   useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/travels/get?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setTrip(data);
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
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        alert("Erreur : Impossible de générer le lien d'accès.");
      }
    } catch (err) {
      console.error("Erreur download:", err);
      alert("Erreur lors de l'ouverture du fichier.");
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAction = async (newStatus: string, note: string = "", extraData: any = null) => {
    setLoadingAction(true);
    const updatedTrip = {
      ...trip,
      status: newStatus,
      data: extraData ? { ...trip.data, ...extraData } : trip.data,
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
    try {
      const res = await fetch('/api/travels/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trip.id, data: updatedTrip })
      });
      if (res.ok) {
        setTrip(updatedTrip);
        if (newStatus === "REJECTED_MODIF") alert("Demande de modification envoyée.");
      }
    } catch (err) {
      console.error("Erreur action:", err);
    } finally {
      setLoadingAction(false);
    }
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatSafeDate = (dateStr: any) => {
    if (!dateStr) return "N/C";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Date à préciser" : d.toLocaleDateString('fr-FR');
  };
  if (!isUserLoaded || !trip) return <p className="p-10 text-center font-medium text-slate-500">Chargement du dossier...</p>;
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-start">
        <button 
          onClick={() => router.push('/travels')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-bold shadow-[0_10px_20px_-10px_rgba(79,70,229,0.4)] hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-2"
        >
          <span>←</span> Retour aux dossiers
        </button>
      </div>
      {trip.status === "REJECTED_MODIF" && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl shadow-sm">
          <h3 className="text-amber-800 font-bold mb-1 flex items-center gap-2">
            <span>⚠️</span> Modification demandée
          </h3>
          <p className="text-amber-700 italic text-sm mb-4">
            &quot;{trip.history?.[trip.history.length - 1]?.note || "Aucun motif précisé"}&quot;
          </p>
          <button 
            onClick={() => router.push(`/travels/simple?edit=${trip.id}`)}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition"
          >
            Modifier le dossier
          </button>
        </div>
      )}
      <div className="flex justify-between items-start border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{trip.data.title}</h1>
          <p className="text-slate-500 mt-1">
            Créé par {trip.ownerName} le {formatSafeDate(trip.createdAt || trip.updatedAt)}
          </p>
        </div>
        <div className="bg-indigo-100 text-indigo-700 px-6 py-2 rounded-full font-bold text-sm">
          {trip.status}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <Step label="Pédagogie (DIR)" active={trip.status === 'PENDING_DIR_INITIAL'} step="1" />
        <Step label="Finances (GEST)" active={trip.status === 'PENDING_COMPTA'} step="2" />
        <Step label="Validation Finale" active={trip.status === 'PENDING_DIR_FINAL' || trip.status === 'VALIDATED'} step="3" />
      </div>
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-slate-800">Récapitulatif de la sortie</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <DetailItem label="Destination" value={trip.data.destination} />
          <DetailItem label="Date prévue" value={formatSafeDate(trip.data.date)} />
          <DetailItem label="Heure de départ" value={trip.data.startTime} />
          <DetailItem label="Heure de retour" value={trip.data.endTime} />
          <DetailItem label="Effectif" value={`${trip.data.nbEleves} élèves (${trip.data.classes})`} />
          <DetailItem label="Budget Estimé" value={`${Math.round(Number(trip.data.coutTotal))} €`} />
          <div className="flex flex-col border-b border-indigo-50 pb-2 bg-indigo-50/30 p-2 rounded-lg">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Coût par élève (Compta)</span>
            <span className="text-indigo-700 font-bold text-lg">{trip.data.costPerStudent ? `${trip.data.costPerStudent} €` : "En attente validation compta"}</span>
          </div>
          <DetailItem label="Pique-nique Cantine" value={trip.data.piqueNique ? "Oui" : "Non"} />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Documents joints</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {trip.data.attachments && trip.data.attachments.length > 0 ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                trip.data.attachments.map((file: any, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => openSecureFile(file.url)}
                    className="text-xs bg-slate-50 border px-3 py-1.5 rounded-lg font-semibold text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    📄 {file.name}
                  </button>
                ))
              ) : (
                <span className="text-sm text-slate-400 italic">Aucun document</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {(isDirection || isCompta) && (
        <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
          <div className="text-center md:text-left">
            <p className="font-bold text-lg">Espace Décisionnaire</p>
            <p className="text-slate-400 text-sm">
              Actions disponibles pour : <span className="text-indigo-400 font-mono italic">{userRoles.join(', ')}</span>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {isDirection && trip.status === 'PENDING_DIR_INITIAL' && (
              <>
                <ActionButton label="Demander modif" color="bg-slate-700" onClick={() => {
                  const note = prompt("Précisez les modifications attendues :");
                  if(note) handleAction("REJECTED_MODIF", note);
                }} />
                <ActionButton label="Valider Projet" color="bg-indigo-600" onClick={() => handleAction("PENDING_COMPTA", "Validé par direction")} />
              </>
            )}

            {isCompta && trip.status === 'PENDING_COMPTA' && (
              <>
                <ActionButton label="Problème Budget" color="bg-slate-700" onClick={() => {
                  const note = prompt("Expliquez le problème financier :");
                  if(note) handleAction("REJECTED_MODIF", note);
                }} />
                <ActionButton label="Valider & Envoyer Coût" color="bg-green-600" onClick={() => {
                  const cost = prompt("Entrez le montant final à facturer par élève (€) :");
                  if(cost) {
                    handleAction("PENDING_DIR_FINAL", "Validé par compta avec coût élève", { costPerStudent: cost });
                  }
                }} />
              </>
            )}

            {isDirection && trip.status === 'PENDING_DIR_FINAL' && (
              <ActionButton label="Signature Finale" color="bg-green-600" onClick={() => handleAction("VALIDATED", "Dossier validé et clos")} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ label, active, step }: { label: string, active: boolean, step: string }) {
  return (
    <div className={`p-4 rounded-2xl border-2 transition-all ${active ? 'border-indigo-500 bg-indigo-50 shadow-sm scale-105' : 'border-slate-100 opacity-50'}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Étape {step}</p>
      <p className="font-bold text-slate-800 text-sm">{label}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col border-b border-slate-50 pb-2">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-slate-700 font-medium">{value || "Non renseigné"}</span>
    </div>
  );
}

function ActionButton({ label, color, onClick }: { label: string, color: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`${color} px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap`}>
      {label}
    </button>
  );
}
"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TripDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [trip, setTrip] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const rawRoles = user?.publicMetadata?.role;
  const userRoles = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];
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
      if (signedUrl) window.open(signedUrl, '_blank');
    } catch (err) {
      alert("Erreur lors de l'ouverture du fichier.");
    }
  };

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
      if (res.ok) setTrip(updatedTrip);
    } catch (err) {
      console.error("Erreur action:", err);
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

  const stepsSimple = [
    { n: "1", label: "Pédagogie", key: "PENDING_DIR_INITIAL" },
    { n: "2", label: "Finances", key: "PENDING_COMPTA" },
    { n: "3", label: "Finalisé", key: "VALIDATED" }
  ];

  const stepsComplex = [
    { n: "1", label: "Pédagogie", key: "PENDING_DIR_INITIAL" },
    { n: "2", label: "Finances", key: "PENDING_COMPTA" },
    { n: "3", label: "Logistique", key: "PROF_LOGISTICS" },
    { n: "4", label: "Finalisé", key: "VALIDATED" }
  ];

  const currentSteps = trip.type === "COMPLEX" ? stepsComplex : stepsSimple;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* RETOUR */}
      <div className="flex justify-start">
        <button onClick={() => router.push('/travels')} className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95">
          <span>←</span> Retour aux dossiers
        </button>
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-start border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{trip.data.title}</h1>
          <p className="text-slate-500 mt-1 uppercase text-xs font-black tracking-tighter">
            {trip.type === "COMPLEX" ? "📁 Dossier Voyage Complexe" : "📄 Sortie Simple"} • Par {trip.ownerName}
          </p>
        </div>
        <div className="bg-indigo-100 text-indigo-700 px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider">
          {trip.status}
        </div>
      </div>

      {/* PROGRESSION */}
      <div className={`grid gap-4 text-center ${trip.type === "COMPLEX" ? "grid-cols-4" : "grid-cols-3"}`}>
        {currentSteps.map((s) => (
          <Step 
            key={s.n} 
            label={s.label} 
            active={trip.status === s.key || (s.key === "VALIDATED" && trip.status === "VALIDATED")} 
            step={s.n} 
          />
        ))}
      </div>

      {/* NOUVEAU : SECTION PÉDAGOGIQUE (POUR LA DIRECTION) */}
      {trip.type === "COMPLEX" && (
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-amber-900 flex items-center gap-2">
            <span>🎓</span> Projet Pédagogique
          </h2>
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Objectifs visés</span>
              <p className="text-slate-700 leading-relaxed mt-1 bg-white/50 p-4 rounded-xl border border-amber-100">
                {trip.data.objectifs || "Aucun objectif renseigné."}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem label="Classes concernées" value={trip.data.classes} />
              <DetailItem label="Accompagnateurs prévus" value={trip.data.nomsAccompagnateurs} />
            </div>
          </div>
        </div>
      )}

      {/* PANNEAU LOGISTIQUE PROF (ÉTAPE 3) */}
      {trip.type === "COMPLEX" && trip.status === "PROF_LOGISTICS" && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-[2rem] p-[2px] shadow-xl">
          <div className="bg-white rounded-[1.9rem] p-8">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl">🚀</span>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Étape 3 : Organisation & Familles</h2>
                <p className="text-slate-500 text-sm">Action requise du professeur organisateur.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
              <div className="p-4 border-2 border-slate-50 rounded-2xl bg-slate-50/50">
                <p className="font-bold text-slate-800 text-sm mb-1">Invitation Réunion</p>
                <button className="text-[10px] font-bold uppercase bg-white border px-3 py-2 rounded-lg shadow-sm">Générer le mail</button>
              </div>
              <div className="p-4 border-2 border-slate-50 rounded-2xl bg-slate-50/50">
                <p className="font-bold text-slate-800 text-sm mb-1">Documents Parents</p>
                <button className="text-[10px] font-bold uppercase bg-white border px-3 py-2 rounded-lg shadow-sm">Pack Autorisations</button>
              </div>
            </div>
            <button 
              onClick={() => handleAction("PENDING_DIR_FINAL", "Logistique terminée")}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
            >
              Finaliser et demander la signature de fin
            </button>
          </div>
        </div>
      )}

      {/* RÉCAPITULATIF TECHNIQUE */}
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-slate-800">Informations Logistiques</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-left">
          <DetailItem label="Destination" value={trip.data.destination} />
          <DetailItem 
            label="Dates du séjour" 
            value={trip.type === "COMPLEX" 
              ? `Du ${formatSafeDate(trip.data.startDate)} au ${formatSafeDate(trip.data.endDate)}` 
              : `Le ${formatSafeDate(trip.data.date)}`
            } 
          />
          <DetailItem label="Horaires prévus" value={`Départ: ${trip.data.startTime} | Retour: ${trip.data.endTime}`} />
          <DetailItem label="Effectif total" value={`${trip.data.nbEleves} élèves`} />
          
          {/* Nouveau : Détails spécifiques Complexe */}
          {trip.type === "COMPLEX" && (
            <>
              <DetailItem label="Besoin Transport (Bus)" value={trip.data.needsBus ? `Oui (Prise en charge : ${trip.data.pickupPoint})` : "Non"} />
              <DetailItem 
                label="Restauration Cantine" 
                value={trip.data.piqueNiqueDetails?.active 
                  ? `${trip.data.piqueNiqueDetails.total} paniers (${trip.data.piqueNiqueDetails.vegetarien} végé, ${trip.data.piqueNiqueDetails.sansPorc} s/porc)` 
                  : "Non demandée"
                } 
              />
            </>
          )}

          <DetailItem label="Budget total estimé" value={`${Math.round(Number(trip.data.coutTotal))} €`} />
          <div className="flex flex-col border-b border-indigo-50 pb-2 bg-indigo-50/30 p-2 rounded-lg">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Coût final par élève</span>
            <span className="text-indigo-700 font-bold text-lg">{trip.data.costPerStudent ? `${trip.data.costPerStudent} €` : "En attente gestionnaire"}</span>
          </div>

          <div className="flex flex-col md:col-span-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Documents et Devis</span>
            <div className="flex flex-wrap gap-2">
              {trip.data.attachments?.map((file: any, idx: number) => (
                <button key={idx} onClick={() => openSecureFile(file.url)} className="text-xs bg-slate-50 border px-3 py-1.5 rounded-lg font-semibold text-indigo-600 hover:bg-indigo-50 transition">
                  📄 {file.name}
                </button>
              )) || <span className="text-sm text-slate-400 italic">Aucune pièce jointe.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS DÉCISIONNAIRES */}
      {(isDirection || isCompta) && (
        <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
          <div className="text-center md:text-left">
            <p className="font-bold text-lg">Espace Décisionnaire</p>
            <p className="text-slate-400 text-sm italic">{userRoles.join(', ')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isDirection && trip.status === 'PENDING_DIR_INITIAL' && (
              <>
                <ActionButton label="Refuser / Modifs" color="bg-slate-700" onClick={() => {
                  const n = prompt("Motif du refus ou des modifs :"); if(n) handleAction("REJECTED_MODIF", n);
                }} />
                <ActionButton label="Valider Pédagogie" color="bg-indigo-600" onClick={() => handleAction("PENDING_COMPTA", "Projet pédagogique validé")} />
              </>
            )}
            {isCompta && trip.status === 'PENDING_COMPTA' && (
              <ActionButton label="Valider Budget" color="bg-green-600" onClick={() => {
                const c = prompt("Coût définitif par élève (€) :");
                if(c) handleAction(trip.type === "COMPLEX" ? "PROF_LOGISTICS" : "PENDING_DIR_FINAL", "Budget validé", { costPerStudent: c });
              }} />
            )}
            {isDirection && trip.status === 'PENDING_DIR_FINAL' && (
              <ActionButton label="Signature Finale" color="bg-green-600" onClick={() => handleAction("VALIDATED", "Dossier officiellement clos")} />
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
      <p className="text-[10px] font-bold uppercase text-indigo-600">Étape {step}</p>
      <p className="font-bold text-slate-800 text-xs">{label}</p>
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

function ActionButton({ label, color, onClick }: { label: string, color: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`${color} px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg`}>
      {label}
    </button>
  );
}
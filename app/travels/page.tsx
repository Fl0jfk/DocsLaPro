"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function TripDashboard() {
  const { isLoaded, isSignedIn} = useUser();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch('/api/travels/list');
        if (res.ok) {
          const data = await res.json();
          setTrips(data);
        }
      } catch (error) {
        console.error("Erreur chargement voyages:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && isSignedIn) {
      fetchTrips();
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn) return null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDate = (trip: any, field: 'created' | 'travel') => {
    let val;
    if (field === 'created') {
      val = trip.createdAt || trip.updatedAt;
    } else {
      val = trip.data?.date;
    }

    if (!val) return "À préciser";
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'VALIDATED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'REJECTED_MODIF': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'PENDING_DIR_INITIAL': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen mt-[10vh]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Espace Voyages</h1>
          <p className="text-slate-500 font-medium">Gestion des déplacements scolaires.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg transition-all"
        >
          + Nouvelle demande
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full text-center py-20">Chargement des dossiers...</div>
        ) : trips.length > 0 ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          trips.map((trip: any) => {
            const isComplex = trip.type === "COMPLEX" || trip.data?.transport;
            const imageUrl = trip.imageUrl || trip.data?.imageUrl || trip.data?.data?.imageUrl;

            return (
              <div 
                key={trip.id} 
                onClick={() => router.push(`/travels/${trip.id}`)}
                className="group bg-white border border-slate-200/60 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer transform-gpu"
              >
                <div className="h-44 w-full relative bg-slate-100 overflow-hidden isolate" style={{ maskImage: 'radial-gradient(white, black)' }}>
                  {imageUrl ? (
                    <Image 
                      src={imageUrl} 
                      alt={trip.data?.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      width={500}
                      height={300}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-slate-50 to-slate-100">
                      {isComplex ? '🚌' : '🍦'}
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-sm ${getStatusStyle(trip.status)}`}>
                      {trip.status?.replace('PENDING_', '').replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${isComplex ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      {isComplex ? 'Voyage Scolaire' : 'Sortie Locale'}
                    </span>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      Dossier du {formatDate(trip, 'created')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {trip.data?.title || "Sans titre"}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                          <span className="text-lg">📍</span> {trip.data?.destination || "Non définie"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {trip.type === "COMPLEX" ? (
                            <span>Du {new Date(trip.data.startDate).toLocaleDateString()} au {new Date(trip.data.endDate).toLocaleDateString()}</span>
                          ) : (
                            <span>Le {new Date(trip.data.date).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:justify-end">
                      <div className="bg-slate-50 px-4 py-3 rounded-2xl text-center min-w-[70px] border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Élèves</p>
                        <p className="text-md font-black text-slate-700">{trip.data?.nbEleves || 0}</p>
                      </div>
                      <div className="bg-slate-50 px-4 py-3 rounded-2xl text-center min-w-[80px] border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Budget</p>
                        <p className="text-md font-black text-slate-700">{Math.round(trip.data?.coutTotal || 0)}€</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-inner">
                        {trip.ownerName?.substring(0, 2)}
                      </div>
                      <span className="text-sm font-bold text-slate-600">{trip.ownerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                      <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">Gérer le dossier</span>
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-xl">Aucun dossier en cours.</p>
          </div>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-10 transform transition-all animate-in fade-in zoom-in duration-300 border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Nouveau Projet</h2>
              <p className="text-slate-500 font-medium">Choisissez le type de déplacement.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => router.push("/travels/simple")} className="group p-6 bg-slate-50 border-2 border-transparent hover:border-indigo-500 hover:bg-indigo-50/50 rounded-3xl transition-all text-left flex items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🍦</div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Sortie de proximité</h3>
                  <p className="text-sm text-slate-500 leading-snug">Sans transport spécifique (Cinéma, parc, musées...)</p>
                </div>
              </button>
              <button onClick={() => router.push("/travels/complex")} className="group p-6 bg-slate-50 border-2 border-transparent hover:border-indigo-500 hover:bg-indigo-50/50 rounded-3xl transition-all text-left flex items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🚌</div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Voyage / Sortie Bus</h3>
                  <p className="text-sm text-slate-500 leading-snug">Transport, budget complexe ou nuitées.</p>
                </div>
              </button>
            </div>
            <button onClick={() => setShowModal(false)} className="mt-8 w-full text-slate-400 hover:text-slate-600 font-bold text-sm uppercase tracking-[0.2em] transition">
              Fermer la fenêtre
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
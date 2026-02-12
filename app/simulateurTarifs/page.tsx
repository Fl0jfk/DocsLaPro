"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Logo from "../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp"

type NiveauScolaire = "maternelle" | "elementaire" | "college" | "lycee";

interface Enfant {
  id: number;
  niveau: NiveauScolaire;
  mode: "externe" | "demi" | "pension";
  repas: number;
  garderie: number;
}

const TARIFS_ENSEIGNEMENT: Record<NiveauScolaire, number[]> = {
  maternelle: [132, 117, 109, 87, 35],
  elementaire: [139, 124, 118, 97, 35],
  college: [164, 149, 140, 112, 45],
  lycee: [164, 149, 140, 112, 55],
};

const TARIFS_DEMI_PENSION: Record<NiveauScolaire, Record<number, number>> = {
  maternelle: { 1: 21, 2: 43, 3: 64, 4: 85 },
  elementaire: { 1: 25, 2: 50, 3: 74, 4: 99 },
  college: { 1: 25, 2: 50, 3: 75, 4: 100, 5: 125 },
  lycee: { 1: 26, 2: 52, 3: 77, 4: 103, 5: 129 },
};

const TARIF_GARDERIE: Record<number, number> = { 1: 15.5, 2: 31, 3: 46.5, 4: 62 };

export default function SimulateurTarifs() {
  const [revenu, setRevenu] = useState<number>(0);
  const [foyer, setFoyer] = useState<number>(1);
  const [enfants, setEnfants] = useState<Enfant[]>([{ id: Date.now(), niveau: "college", mode: "demi", repas: 4, garderie: 0 },]);
  const [resultat, setResultat] = useState({ contribution: 0, reste: 0, total: 0 });
  const ajouterEnfant = () => { setEnfants([...enfants, { id: Date.now(), niveau: "college", mode: "demi", repas: 4, garderie: 0 }]);};
  const supprimerEnfant = (id: number) => { if (enfants.length > 1) setEnfants(enfants.filter((e) => e.id !== id));};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateEnfant = (id: number, field: keyof Enfant, value: any) => { setEnfants(enfants.map(e => e.id === id ? { ...e, [field]: value } : e));};
  useEffect(() => {
    const QF = foyer > 0 ? revenu / foyer : 0;
    let totalContributionBase = 0;
    let totalAutresFrais = 0;
    enfants.forEach((enfant, index) => {
      const indexQF = QF > 14660 ? 0 : QF >= 10930 ? 1 : QF >= 6920 ? 2 : QF >= 4610 ? 3 : 4;
      let prixEnseignement = TARIFS_ENSEIGNEMENT[enfant.niveau][indexQF];
      if (index >= 4) prixEnseignement = 0;
      totalContributionBase += prixEnseignement;
      if (enfant.mode === "demi") {
        totalAutresFrais += TARIFS_DEMI_PENSION[enfant.niveau][enfant.repas] || 0;
      } else if (enfant.mode === "pension") {
        totalAutresFrais += 589;
      }
      if (enfant.niveau === "maternelle" || enfant.niveau === "elementaire") {
        totalAutresFrais += TARIF_GARDERIE[enfant.garderie] || 0;
      }
    });
    const contributionFinale = enfants.length >= 3 ? totalContributionBase * 0.9 : totalContributionBase;
    setResultat({
      contribution: contributionFinale,
      reste: totalAutresFrais,
      total: contributionFinale + totalAutresFrais
    });
  }, [revenu, foyer, enfants]);
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-2xl my-10 font-sans text-slate-800">
        <div className="flex items-end justify-between mb-4">
            <Image src={Logo} width={100} height={100} alt="logo"/>
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 text-end">Simulateur de Tarifs</h2>
                <p className="text-sm font-bold text-blue-600 text-end">La Providence Nicolas Barré • 2026 / 2027</p>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Revenu Fiscal de Référence (€)</label>
                <input type="number" className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-500 transition-all" onChange={(e) => setRevenu(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Personnes au foyer</label>
                <input type="number" className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-500 transition-all" value={foyer} onChange={(e) => setFoyer(Number(e.target.value))} min="1" />
            </div>
        </div>
        <div className="space-y-4 mb-8">
            {enfants.map((enfant, index) => (
                <div key={enfant.id} className="group relative bg-white border-2 border-slate-100 p-6 rounded-2xl hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black uppercase px-3 py-1 bg-slate-900 text-white rounded-lg">Enfant #{index + 1}</span>
                        {enfants.length > 1 && (
                            <button onClick={() => supprimerEnfant(enfant.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Niveau</label>
                            <select className="w-full bg-slate-50 border-none rounded-lg p-2 font-bold text-sm cursor-pointer" value={enfant.niveau} onChange={(e) => updateEnfant(enfant.id, "niveau", e.target.value)}>
                                <option value="maternelle">Maternelle</option>
                                <option value="elementaire">Élémentaire</option>
                                <option value="college">Collège</option>
                                <option value="lycee">Lycée</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Régime</label>
                            <select className="w-full bg-slate-50 border-none rounded-lg p-2 font-bold text-sm cursor-pointer" value={enfant.mode} onChange={(e) => updateEnfant(enfant.id, "mode", e.target.value)}>
                                <option value="externe">Externe</option>
                                <option value="demi">Demi-pension</option>
                                {(enfant.niveau === "college" || enfant.niveau === "lycee") && <option value="pension">Pensionnaire</option>}
                            </select>
                        </div>
                        {enfant.mode === "demi" && (
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Repas / Semaine</label>
                                <select className="w-full bg-slate-50 border-none rounded-lg p-2 font-bold text-sm cursor-pointer" value={enfant.repas} onChange={(e) => updateEnfant(enfant.id, "repas", Number(e.target.value))}>
                                    {[1,2,3,4].map(n => <option key={n} value={n}>{n} repas</option>)}
                                    {(enfant.niveau === "college" || enfant.niveau === "lycee") && <option value={5}>5 repas</option>}
                                </select>
                            </div>
                        )}
                        {(enfant.niveau === "maternelle" || enfant.niveau === "elementaire") && (
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Garderie / Étude</label>
                                <select className="w-full bg-slate-50 border-none rounded-lg p-2 font-bold text-sm cursor-pointer" value={enfant.garderie} onChange={(e) => updateEnfant(enfant.id, "garderie", Number(e.target.value))}>
                                    {[0,1,2,3,4].map(n => <option key={n} value={n}>{n} jour(s)</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            <button onClick={ajouterEnfant} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 font-bold hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Ajouter un enfant
            </button>
        </div>
        <div className="bg-blue-600 text-white rounded-3xl p-8 shadow-xl shadow-blue-200 relative overflow-hidden">
            <div className="relative z-10 flex flex-col justify-between items-center w-full gap-6">
                <div className="space-y-4 w-full text-white">
                    <div className="flex justify-between border-b border-blue-500 pb-2">
                        <span className="text-sm font-bold opacity-80">Contribution Familiale {enfants.length >= 3 && "(Remise -10% incluse)"}</span>
                        <span className="font-black">{resultat.contribution.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-500 pb-2">
                        <span className="text-sm font-bold opacity-80">Restauration & Services</span>
                        <span className="font-black">{resultat.reste.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-end pt-2">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Mensuel Estimé</p>
                            <p className="text-4xl font-black">{resultat.total.toFixed(2)} € <small className="text-sm font-normal">/ mois</small></p>
                        </div>
                    </div>
                </div>
                <div className="bg-white text-blue-600 p-4 rounded-2xl text-[10px] font-bold uppercase leading-tight md:w-64 text-center">Estimation sur 10 mois, hors options facultatives et assurance.</div>
            </div>
        </div>
    </div>
  );
}
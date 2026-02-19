"use client";

import Image from "next/image";
import logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";
import { useState, useEffect } from "react";

export default function TransportRequestPage() {
    const [date, setDate] = useState(""); 
    const [dateLimite, setDateLimite] = useState("");
    const [lieu, setLieu] = useState(""); 
    const calculerDateLimite = (dateSortie: string | number | Date) => {
        const dateSortieObj = new Date(dateSortie);
        dateSortieObj.setDate(dateSortieObj.getDate() - 7);
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long'
        };
        const dateLimiteeFormatee = new Intl.DateTimeFormat('fr-FR', options).format(dateSortieObj);
        setDateLimite(dateLimiteeFormatee);
    };
    useEffect(() => {
        if (date) { calculerDateLimite(date)}
    }, [date]);
    return (
        <div className="flex flex-col items-center bg-slate-100 py-6  print:bg-white print:py-0">
            <div className="bg-white px-[14mm] py-[11mm] border border-slate-200 shadow-xl w-[210mm] min-h-[297mm] flex flex-col print:shadow-none print:border-none">
                <div className="flex justify-between items-start border-b-4 border-blue-600 pb-4 mb-4">
                    <div className="flex gap-6 items-center">
                        <Image src={logo} width={110} height={110} alt="Logo"/>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">La Providence</h1>
                            <p className="text-2xl font-bold text-blue-600 uppercase tracking-tight">Nicolas Barré</p>
                            <div className="mt-2 text-xs font-bold text-slate-500 uppercase">
                                <p>6, rue de Neuvillette 76240 LE MESNIL ESNARD</p>
                                <p>Tél : 02-32-86-50-90</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className="bg-blue-600 p-2 rounded-2xl mb-2 shadow-md">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <polyline points="17 11 19 13 23 9" />
                            </svg>
                        </div>
                        <p className="text-2xl font-black text-blue-600 leading-none uppercase tracking-tighter">Autorisation</p>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mt-1 italic">Interne / Sortie</p>
                    </div>
                </div>

                {/* TITRE */}
                <div className="bg-slate-900 rounded-[40px] p-8 mb-4 text-center shadow-lg">
                    <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Autorisation de sortie</h2>
                    <h3 className="text-xl font-bold text-blue-400 uppercase tracking-tight italic">Repas de classe & Activités</h3>
                </div>
                <div className="bg-amber-50 border-4 border-dashed border-amber-200 p-4 rounded-[30px] mb-4 flex flex-col justify-center items-center gap-4">
                    <span className="text-amber-600 font-black uppercase text-sm tracking-wider">⚠️ À signer impérativement avant le :</span>
                    <span className="text-xl text-slate-900 font-black underline decoration-amber-400 decoration-4">{dateLimite || "...................................."}</span>
                </div>
                <section className="flex-grow space-y-4">
                    <div className="bg-blue-50/40 px-8 py-6 rounded-[50px] border-2 border-blue-100 shadow-inner space-y-6">
                        <p className="text-xl text-slate-700 font-bold text-center leading-relaxed">
                            Autorise mon enfant à participer à une sortie organisée par les élèves et leurs professeurs :
                        </p>
                        <div className="space-y-8">
                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-black uppercase text-blue-600 ml-4 tracking-widest">Date de la sortie :</span>
                                <input 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-white border-4 border-blue-200 rounded-[25px] p-6 text-xl font-black text-slate-800 shadow-sm focus:border-blue-500 outline-none" 
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-black uppercase text-blue-600 ml-4 tracking-widest">Lieu de l&apos;événement :</span>
                                <select 
                                    className="w-full bg-white border-4 border-blue-200 rounded-[25px] p-6 text-xl font-black text-slate-800 shadow-sm focus:border-blue-500 outline-none appearance-none"
                                    value={lieu}
                                    onChange={(e) => setLieu(e.target.value)}
                                >
                                    <option value="">-- Sélectionner le lieu --</option>
                                    <option value="McDonald's Laser Game">McDonald&apos;s + Laser Game de Rouen</option>
                                    <option value="Pique Nique Laser Game">Pique-Nique + Laser Game de Rouen</option>
                                    <option value="McDo Cinéma">McDonald&apos;s + Cinéma de Rouen</option>
                                    <option value="Nachos Cinéma">Nachos + Cinéma de Rouen</option>
                                    <option value="McDo Bowling">McDonald&apos;s + Bowling</option>
                                    <option value="Restaurant La Pasta Tinto">Restaurant La Pasta Tinto</option>
                                    <option value="Bowling Amfreville La Mi-Voie">Bowling Amfreville La Mi-Voie</option>
                                    <option value="Domicile de Mr FAUCHEUX">Domicile de Mr FAUCHEUX</option>
                                    <option value="Domicile de Mme BALESTA">Domicile de Mme BALESTA</option>
                                    <option value="Trampoline PARK Tourville La Rivière">Trampoline PARK Tourville La Rivière</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-slate-100">
                                <span className="text-xs font-black uppercase text-slate-500 whitespace-nowrap">Accompagnateurs :</span>
                                <input 
                                    type="text"
                                    className="flex-1 bg-transparent border-b-2 border-slate-200 outline-none p-1 text-xl font-bold focus:border-blue-300"
                                />
                            </div>
                        </div>
                    </div>
                </section>
                <div className="mt-4 grid grid-cols-2">
                    <div></div>
                    <div className="bg-blue-600 rounded-[40px] p-6 text-white flex flex-col items-center justify-center text-center shadow-xl shadow-blue-100">
                        <p className="text-2xl font-black italic">Madame DONA</p>
                        <p className="text-sm font-bold uppercase mt-2">Directrice du lycée</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
"use client";

import React from 'react';
import Image from "next/image";

export default function FicheSanitaire() {
  return (
    <div className="max-w-4xl mx-auto my-10 space-y-10 print:space-y-0 print:my-0">
      
      {/* --- PAGE 1 : RECTO (IDENTITÉ & URGENCE) --- */}
      <div className="bg-white p-10 border border-slate-200 shadow-xl min-h-[1100px] flex flex-col print:shadow-none print:border-none">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-4 border-blue-600 pb-8 mb-10">
          <div className="flex gap-6 items-center">
            <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" width={90} height={90} alt="Logo" />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Collège La Providence</h1>
              <p className="text-sm font-bold text-slate-500 uppercase">76240 LE MESNIL ESNARD</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-blue-600">FICHE SANITAIRE</p>
            <p className="text-sm font-bold">ANNÉE 2025 / 2026</p>
          </div>
        </div>

        {/* SECTION 1 : ÉLÈVE */}
        <section className="mb-12">
          <h2 className="bg-slate-900 text-white px-4 py-2 text-sm font-black uppercase mb-6 inline-block rounded-r-full">1. Identification de l'élève</h2>
          <div className="grid grid-cols-1 gap-8">
            <div className="flex items-end gap-4">
              <span className="text-sm font-bold uppercase min-w-[150px]">Nom et Prénom :</span>
              <div className="flex-1 border-b-2 border-slate-200 pb-1"></div>
            </div>
            <div className="grid grid-cols-2 gap-8">
                <div className="flex items-end gap-4">
                    <span className="text-sm font-bold uppercase">Né(e) le :</span>
                    <div className="flex-1 border-b-2 border-slate-200 pb-1"></div>
                </div>
                <div className="flex items-end gap-4">
                    <span className="text-sm font-bold uppercase">À :</span>
                    <div className="flex-1 border-b-2 border-slate-200 pb-1"></div>
                </div>
            </div>
            <div className="flex items-start gap-4 h-20">
              <span className="text-sm font-bold uppercase min-w-[150px]">Adresse :</span>
              <div className="flex-1 border-b-2 border-slate-200 h-full"></div>
            </div>
          </div>
        </section>

        {/* SECTION 2 : RESPONSABLES & URGENCE */}
        <section className="mb-12 flex-1">
          <h2 className="bg-slate-900 text-white px-4 py-2 text-sm font-black uppercase mb-6 inline-block rounded-r-full">2. Personnes à prévenir en cas d'urgence</h2>
          <p className="text-xs italic text-slate-500 mb-4 font-bold">Indiquez l'ordre de priorité (1, 2, 3) pour les appels de l'infirmerie.</p>
          <div className="space-y-6">
            {[1, 2, 3].map((num) => (
              <div key={num} className="grid grid-cols-12 gap-4 border-2 border-slate-100 p-4 rounded-xl">
                <div className="col-span-1 flex items-center justify-center font-black text-2xl text-blue-200">{num}</div>
                <div className="col-span-4 space-y-4">
                    <div className="border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase">Nom / Prénom</div>
                    <div className="border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase">Lien (Père, Mère...)</div>
                </div>
                <div className="col-span-4 space-y-4">
                    <div className="border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase">Lieu (Travail/Ville)</div>
                    <div className="border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase">Téléphone Fixe</div>
                </div>
                <div className="col-span-3 flex items-end">
                    <div className="w-full border-b-2 border-blue-600 pb-1 text-[10px] font-black text-blue-600 uppercase italic">Mobile Prioritaire</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER RECTO */}
        <div className="border-t-2 border-slate-100 pt-6 flex justify-between items-end">
            <div className="text-[10px] max-w-sm font-medium italic text-slate-400">
                Note : Pour toute modification de coordonnées en cours d'année, merci de prévenir immédiatement le secrétariat de direction.
            </div>
            <p className="text-xs font-black uppercase text-slate-300">Page 1 / 2 (Tournez SVP)</p>
        </div>
      </div>

      {/* --- PAGE 2 : VERSO (SANTÉ & AUTORISATIONS) --- */}
      <div className="bg-white p-10 border border-slate-200 shadow-xl min-h-[1100px] flex flex-col print:shadow-none print:border-none print:break-before-page">
        
        {/* SECTION 3 : SANTÉ & MÉDICAL */}
        <section className="mb-10">
          <h2 className="bg-red-600 text-white px-4 py-2 text-sm font-black uppercase mb-6 inline-block rounded-r-full">3. Informations Médicales</h2>
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-6">
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <h4 className="text-xs font-black text-red-600 uppercase mb-2">Allergies connues (Alimentaires/Médicaments)</h4>
                    <div className="h-24 border-b border-red-200"></div>
                </div>
                <div className="p-4 border-2 border-slate-100 rounded-xl">
                    <h4 className="text-xs font-black uppercase mb-2">Médecin Traitant</h4>
                    <p className="text-sm border-b border-slate-100 mb-2">Nom :</p>
                    <p className="text-sm border-b border-slate-100">Tél :</p>
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase mb-2 underline">Antécédents & Traitements</h4>
                <p className="text-[11px] leading-relaxed italic text-slate-500">Précisez si l'élève est sujet à : asthme, épilepsie, diabète, problèmes cardiaques, ou s'il a subi une intervention chirurgicale récente.</p>
                <div className="h-40 border-b-2 border-slate-100"></div>
            </div>
          </div>
        </section>

        {/* SECTION 4 : PROTOCOLE INFIRMERIE (DÉTAILLÉ) */}
        <section className="mb-10 p-6 bg-blue-50 border-2 border-blue-600 rounded-2xl">
          <h2 className="text-blue-600 text-sm font-black uppercase mb-4 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
            Protocole de soins et pharmacie
          </h2>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                <p className="text-xs font-bold uppercase underline">Choix des parents pour l'administration :</p>
                <div className="flex gap-8">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <span className="w-5 h-5 border-2 border-blue-600 rounded"></span> Donner <strong>avant</strong> de prévenir la famille
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer font-bold">
                        <span className="w-5 h-5 border-2 border-blue-600 rounded"></span> Appeler <strong>avant</strong> toute administration
                    </label>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-xs font-bold uppercase mb-4">L'infirmière est autorisée à administrer les spécialités suivantes :</p>
                <div className="grid grid-cols-3 gap-4">
                    {['Doliprane / Paracétamol', 'Spasfon (Douleurs)', 'Vogalène (Nausées)', 'Lysopaïne (Maux de gorge)', 'Smecta (Diarrhée)', 'Gaviscon (Estomac)'].map(m => (
                        <div key={m} className="flex items-center gap-3 text-[10px] font-bold">
                            <span className="w-4 h-4 border-2 border-slate-400"></span> {m}
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 : AUTORISATION LÉGALE */}
        <section className="flex-1 p-6 border-2 border-slate-900 rounded-2xl relative">
          <h2 className="text-sm font-black uppercase mb-4">Autorisation d'Urgence & Hospitalisation</h2>
          <p className="text-xs leading-relaxed mb-8">
            Je soussigné(e) <span className="border-b-2 border-slate-200 inline-block w-48"></span>, responsable légal de l'élève, déclare autoriser le Chef d'Établissement du Lycée La Providence, à prendre, sur avis médical, en cas de maladie ou accident de l'élève, toutes mesures d'urgences, tant médicales que chirurgicales, y compris éventuellement l'hospitalisation au <strong>CHU Charles Nicolle (Rouen)</strong>.
          </p>

          <div className="grid grid-cols-2 gap-10 items-end">
            <div className="space-y-4">
                <p className="text-xs font-bold">Mention manuscrite "Lu et approuvé" :</p>
                <div className="h-10 border-b border-slate-200"></div>
                <p className="text-xs font-bold italic">Fait à ........................, le ........................</p>
            </div>
            <div className="text-center">
                <p className="text-xs font-black uppercase mb-2">Signature du responsable</p>
                <div className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 italic text-[10px]">
                    Cadre réservé à la signature
                </div>
            </div>
          </div>
        </section>

        {/* BAS DE PAGE (PIÈCES JOINTES) */}
        <div className="mt-8 flex justify-between items-center bg-red-600 text-white p-4 rounded-xl">
            <div className="flex gap-4 items-center">
                <div className="text-2xl">⚠️</div>
                <p className="text-[11px] font-black uppercase leading-tight">
                    Important : Joindre obligatoirement la photocopie<br/>des vaccinations du carnet de santé.
                </p>
            </div>
            <div className="text-right border-l border-white/30 pl-4">
                <p className="text-[10px] font-bold">Numéro de Sécurité Sociale du parent :</p>
                <p className="text-sm font-mono">_ _ / _ _ / _ _ / _ _ _ / _ _ _ / _ _</p>
            </div>
        </div>
      </div>

    </div>
  );
}
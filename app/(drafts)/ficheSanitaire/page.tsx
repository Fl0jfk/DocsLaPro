"use client";

import Image from "next/image";

export default function FicheSanitaire() {
  return (
    <div className="max-w-4xl mx-auto my-10 space-y-10 print:space-y-0 print:my-0">
      <div className="bg-white p-10 border border-slate-200 shadow-xl min-h-[1100px] flex flex-col print:shadow-none print:border-none">
        <div className="flex justify-between items-start border-b-4 border-blue-600 pb-4 mb-6">
          <div className="flex gap-6 items-center">
            <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" width={90} height={90} alt="Logo" />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">La Providence Nicolas Barré</h1>
              <p className="text-sm font-bold text-slate-500 uppercase">6, rue de Neuvillette 76240 LE MESNIL ESNARD</p>
              <span className="text-sm font-bold text-slate-500 uppercase">02-32-86-50-90</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-2 drop-shadow-sm">
              <path d="M10 3H14V10H21V14H14V21H10V14H3V10H10V3Z" fill="#ef4444" />
            </svg>
            <p className="text-xl font-black text-blue-600">FICHE SANITAIRE</p>
            <p className="text-sm font-bold">ANNÉE 2026 / 2027</p>
          </div>
        </div>
        <section className="mb-8">
          <h2 className="bg-slate-900 text-white px-4 py-2 text-sm font-black uppercase mb-6 inline-block rounded-r-full">1. Identification de l&apos;élève</h2>
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
            <div className="flex items-start gap-4 h-12">
              <span className="text-sm font-bold uppercase min-w-[150px]">Adresse :</span>
              <div className="flex-1 border-b-2 border-slate-200 h-full"></div>
            </div>
          </div>
        </section>
        <section className=" flex-1 mb-4">
          <h2 className="bg-slate-900 text-white px-4 py-2 text-sm font-black uppercase mb-6 inline-block rounded-r-full">2. Personnes à prévenir en cas d&apos;urgence</h2>
          <p className="text-xs italic text-slate-500 mb-4 font-bold">Indiquez l&apos;ordre de priorité (1, 2, 3) pour les appels de l&apos;infirmerie.</p>
          <div className="space-y-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="grid grid-cols-12 gap-4 border-2 border-slate-100 p-4 rounded-xl">
                <div className="col-span-1 flex items-center justify-center font-black text-2xl text-blue-200">{num}</div>
                <div className="col-span-7 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase whitespace-nowrap">Nom/Prénom :</span>
                    <div className="flex-1 h-4"></div>
                  </div>
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase whitespace-nowrap">Lien :</span>
                    <div className="flex-1 h-4"></div>
                  </div>
                </div>
                <div className="col-span-4 flex items-end">
                  <div className="w-full border-b-2 border-blue-600 pb-1">
                    <span className="text-[9px] font-black text-blue-600 uppercase italic block mb-1">Mobile Prioritaire :</span>
                    <div className="h-4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs italic text-slate-500 mt-4 font-bold">
            <p>Les données de santé figurant sur le présent document sont recueillies par l&apos;établissement afin, notamment, de répondre aux demandes des services médicaux d&apos;urgences.</p>
            <p>Elles sont susceptibles d&apos;être transmises à toute personne en ayant la nécessité dans l&apos;établissement et tout service médicaux si nécessaire.</p>
          </div>
        </section>
        <div className="flex justify-between items-center bg-red-600 text-white p-4 rounded-xl">
            <div className="flex gap-4 items-center w-1/2">
                <div className="text-2xl">⚠️</div>
                <p className="text-[11px] font-black uppercase leading-tight">Important : Joindre obligatoirement la photocopie<br/>des vaccinations du carnet de santé.</p>
            </div>
            <div className="w-1/2">
              <div className="text-right border-l border-white/30 pl-4">
                <p className="text-[10px] font-bold">Numéro de Sécurité Sociale du parent :</p>
                <p className="text-sm font-mono h-6"></p>
              </div>
              <div className="text-right border-l border-white/30 pl-4">
                  <p className="text-[10px] font-bold">Mutuelle (N°AMC ou code de télétransmission):</p>
                  <p className="text-sm font-mono h-6"></p>
              </div>
            </div>
        </div>
      </div>
      <div className="bg-white p-10 border border-slate-200 shadow-xl min-h-[1100px] flex flex-col print:shadow-none print:border-none print:break-before-page">
        <section className="mb-4">
          <h2 className="bg-red-600 text-white px-4 py-2 text-sm font-black uppercase mb-4 inline-block rounded-r-full">3. Informations Médicales</h2>
          <div className="space-y-4">
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-sm font-black text-red-600 uppercase">Allergies, Antécédents & Traitements en cours</h4>
                  <p className="text-red-500 font-black text-[10px] italic mt-1 uppercase tracking-tight">
                    Précisez si l&apos;élève est sujet à : maladie chronique, asthme, épilepsie, diabète, problèmes cardiaques, s&apos;il a un PAP, PAI ou s&apos;il a subi une intervention chirurgicale récente, etc.
                  </p>
                </div>
              </div>
              <div className="space-y-6 mt-4">
                <div className="border-b border-red-200 h-6"></div>
                <div className="border-b border-red-200 h-6"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border-2 border-slate-100 rounded-2xl">
                <h4 className="text-xs font-black uppercase mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-slate-400 rounded-full"></span> Médecin Traitant
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Nom :</span>
                    <div className="flex-1 h-4"></div>
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tél :</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border-2 border-slate-100 rounded-2xl">
                <h4 className="text-xs font-black uppercase mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-slate-400 rounded-full"></span> Hôpital (Par défaut : CHU)
                </h4>
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Si autre, précisez :</p>
                  <div className="border-b border-slate-100 h-4 mt-4"></div>
                  
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="mb-4 p-6 pb-2 bg-blue-50 border-2 border-blue-600 rounded-2xl">
          <h2 className="text-blue-600 text-sm font-black uppercase mb-4 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
            Protocole de soins et pharmacie
          </h2>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-xs font-bold uppercase mb-4">L&apos;infirmière est autorisée à administrer les spécialités suivantes :</p>
                <div className="grid grid-cols-4 gap-4">
                    {['Doliprane / Paracétamol', 'Spasfon (Douleurs)', 'Vogalène (Nausées)', 'Lysopaïne (Maux de gorge)', 'Smecta (Diarrhée)', 'Hextril (Antiseptique)', 'Allergix (Réaction allergique)'].map(m => (
                        <div key={m} className="flex items-center gap-3 text-[10px] font-bold">
                            <span></span> {m}
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                <p className="text-xs font-bold uppercase underline">Choix des parents pour l&apos;administration :</p>
                <div className="flex gap-8">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <span className="w-5 h-5 border-2 border-blue-600 rounded"></span> Donner <strong>avant</strong> de prévenir la famille
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer font-bold">
                        <span className="w-5 h-5 border-2 border-blue-600 rounded"></span> Appeler <strong>avant</strong> toute administration
                    </label>
                </div>
            </div>
            
          </div>
        </section>
        <section className="flex-1 p-6 border-2 border-slate-900 rounded-2xl relative">
          <h2 className="text-sm font-black uppercase mb-4">Autorisation d&apos;Urgence & Hospitalisation</h2>
          <p className="text-xs leading-relaxed mb-4">
            Je soussigné(e) <span className="border-b-2 border-slate-200 inline-block w-96"></span>, responsable légal de l&apos;élève, déclare autoriser le Chef d&apos;Établissement, à prendre, sur avis médical, en cas de maladie ou accident de l&apos;élève, toutes mesures d&apos;urgences, tant médicales que chirurgicales, y compris éventuellement l&apos;hospitalisation au <strong>CHU de Rouen</strong>.
          </p>
          <div className="grid grid-cols-2 gap-10 items-end">
            <div className="space-y-4">
                <p className="text-xs font-bold">Mention &apos;Lu et approuvé&apos; :</p>
                <div className="h-10 border-b border-slate-200"></div>
                <p className="text-xs font-bold italic">Fait à ....................................., le ......................</p>
            </div>
            <div className="text-center">
                <p className="text-xs font-black uppercase mb-2">Signature du responsable</p>
                <div className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 italic text-[10px]">
                    Cadre réservé à la signature
                </div>
            </div>
          </div>
        </section>        
      </div>
    </div>
  );
}
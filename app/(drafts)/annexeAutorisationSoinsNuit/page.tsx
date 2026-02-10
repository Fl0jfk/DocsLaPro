"use client";

import Image from "next/image";

export default function AnnexeInternatPDF() {
  return (
    <div className="max-w-4xl mx-auto my-10 space-y-10 print:space-y-0 print:my-0">
      <div className="bg-white p-10 border border-slate-200 shadow-xl min-h-[1100px] flex flex-col print:shadow-none print:border-none">
        <div className="flex justify-between items-start border-b-4 border-amber-500 pb-2 mb-4">
          <div className="flex gap-4 items-center">
            <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" width={90} height={90} alt="Logo" />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">La Providence Nicolas Barré</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-tight italic">Protocole de Soins de Nuit - Internat</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="bg-amber-500 p-2 rounded-lg mb-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            </div>
            <p className="text-xl font-black text-amber-600 uppercase">Annexe Internat</p>
            <p className="text-xs font-bold text-slate-500 italic whitespace-nowrap">CADRE SPÉCIFIQUE HORS INFIRMERIE</p>
          </div>
        </div>
        <section className="mb-4">
          <h2 className="bg-slate-900 text-white px-4 py-2 text-sm font-black uppercase mb-4 inline-block rounded-r-full font-sans">1. Identification de l&apos;élève</h2>
          <div className="flex w-full gap-8">
            <div className="flex items-end gap-4 w-2/3">
              <span className="text-[10px] font-black uppercase text-slate-400">Nom et Prénom :</span>
              <div className="flex-1 border-b-2 border-slate-100 pb-1"></div>
            </div>
            <div className="flex items-end gap-4 w-1/3">
              <span className="text-[10px] font-black uppercase text-slate-400">Classe :</span>
              <div className="flex-1 border-b-2 border-slate-100 pb-1"></div>
            </div>
          </div>
        </section>
        <section className="mb-4 font-sans">
          <h2 className="bg-amber-600 text-white px-4 py-2 text-sm font-black uppercase mb-4 inline-block rounded-r-full">2. Engagement des responsables légaux</h2>
          <div className="bg-amber-50 border-2 border-amber-200 px-6 py-4 rounded-2xl space-y-4">
            <p className="text-[11px] leading-relaxed text-amber-900 font-bold uppercase">En l&apos;absence de personnel infirmier durant la nuit, l&apos;administration de médicaments est assurée par le personnel de surveillance.</p>
            <div className="space-y-4 text-slate-700">
                <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border-2 border-amber-600 rounded flex-shrink-0 mt-0.5 bg-white"></div>
                    <p className="text-[10px] font-bold uppercase mt-1">Je reconnais avoir été informé(e) que le personnel de nuit n&apos;est pas soignant et ne peut poser aucun diagnostic médical.</p>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border-2 border-amber-600 rounded flex-shrink-0 mt-0.5 bg-white"></div>
                    <p className="text-[10px] font-bold uppercase mt-1">J&apos;autorise le personnel à assister mon enfant dans la prise de son traitement uniquement sur présentation d&apos;une ordonnance.</p>
                </div>
            </div>
          </div>
        </section>
        <section className="mb-4 flex-1 font-sans">
          <h2 className="bg-slate-900 text-white px-4 py-2 text-sm font-black uppercase mb-4 inline-block rounded-r-full">3. Traitement à administrer (selon ordonnance)</h2>
          <div className="border-2 border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-100">
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 w-1/2">Médicament</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 w-1/2">Posologie</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="p-4 h-10"></td>
                    <td className="p-4 h-10 border-l border-slate-50"></td>
                    <td className="p-4 h-10 border-l border-slate-50"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 pt-2 border-2 border-red-600 rounded-xl bg-white">
            <p className="text-red-600 font-black text-[10px] uppercase flex items-center gap-2">
                <span className="text-lg">⚠️</span> Protocole urgence de nuit (fièvre / douleur aiguë)
            </p>
            <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase leading-tight">En l'absence d'une ordonnance médicale de soins courants (précisant par exemple les modalités d'administration de Doliprane en cas de fièvre ou de Spasfon pour des maux de ventre), aucun médicament ne sera administré sans l'avis préalable de l'infirmière ou du SAMU (15). Si l'état de l'élève le nécessite, la famille sera invitée à venir chercher l'enfant ou, à défaut, le surveillant d'internat organisera une prise en charge par les services de secours</p>
          </div>
        </section>
        <section className="px-8 py-4 border-4 border-slate-900 rounded-3xl font-sans">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-6">
                <p className="text-xs font-black uppercase underline tracking-tighter">Autorisation finale</p>
                <p className="text-[10px] font-bold uppercase leading-relaxed text-slate-500">
                    Je soussigné(e), responsable légal de l&apos;élève, autorise le personnel de surveillance de l&apos;internat à administrer les soins listés ci-dessus.
                </p>
                <p className="text-[10px] font-black mt-8">FAIT À : ...............................................</p>
                <p className="text-[10px] font-black">LE : ......... / ......... / 2026</p>
            </div>
            <div className="text-center">
                <p className="text-[10px] font-black uppercase mb-4">Signature du responsable (Lu et approuvé)</p>
                <div className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 italic text-[10px] uppercase">
                    Cadre réservé à la signature
                </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
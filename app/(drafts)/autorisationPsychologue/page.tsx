"use client";

import Image from "next/image";

export default function AutorisationPsychologue() {
  return (
    <div className="max-w-4xl mx-auto my-10 space-y-10 print:space-y-0 print:my-0">
      <div className="bg-white p-10 border border-slate-200 shadow-xl min-h-[1100px] flex flex-col print:shadow-none print:border-none">
        <div className="flex justify-between items-start border-b-4 border-blue-600 pb-4 mb-4">
          <div className="flex gap-6 items-center">
            <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" width={90} height={90} alt="Logo" />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">La Providence Nicolas Barré</h1>
              <p className="text-sm font-bold text-slate-500 uppercase">6, rue de Neuvillette 76240 LE MESNIL ESNARD</p>
              <span className="text-sm font-bold text-slate-500 uppercase">02-32-86-50-90</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="bg-blue-600 p-2.5 rounded-lg mb-2 shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            </div>
            <p className="text-xl font-black text-blue-600 leading-none">AUTORISATION</p>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Psychologue Scolaire</p>
          </div>
        </div>
        <section>
          <h2 className="bg-slate-900 text-white px-4 py-0 text-sm font-black uppercase mb-4 inline-block rounded-r-full">Informations aux familles</h2>
          <div className="space-y-6 text-slate-700">
            <p className="font-bold text-sm leading-relaxed">
              Chers parents, <br />
              Dans le cadre de l’accompagnement des élèves, nous vous informons que <span className="text-blue-600 font-black">M. Thomas Perez</span>, psychologue de l’établissement, est disponible pour rencontrer les élèves qui en exprimeraient le besoin ou pour lesquels un membre de l’équipe éducative estime qu’un échange pourrait être bénéfique.
            </p>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-xs font-black uppercase text-slate-500 mb-4 tracking-widest">La mission de M. Perez consiste à :</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Offrir une écoute bienveillante et confidentielle",
                  "Orienter vers un professionnel de santé extérieur",
                  "Accompagner la relation élève / famille / école",
                  "Conseiller sur les questions d'orientation scolaire"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start text-xs font-bold">
                    <span className="text-blue-600 font-black">●</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4 items-center bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl">
                <span className="text-2xl text-amber-500">ℹ️</span>
                <p className="text-[11px] font-bold text-amber-800 leading-tight">
                    Important : M. Perez n’effectue ni tests psychologiques, ni suivi thérapeutique au sein de l’établissement.
                    Votre accord écrit est indispensable pour tout entretien. Cette autorisation est valable pour l’année <span className="font-black underline">2026/2027</span>.
                </p>
            </div>
          </div>
        </section>
        <section className="flex-1 mt-4 border-2 border-blue-600 rounded-[40px] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-2 font-black text-[10px] uppercase">Réponse obligatoire</div>
          <div className="grid grid-cols-1 gap-8 mb-6">
            <div className="flex items-center gap-4 pb-4">
              <span className="text-xs font-black uppercase text-slate-400 min-w-[200px]">Parent ou responsable légal :</span>
            </div>
            <div className="flex items-center gap-4 pb-4">
              <span className="text-xs font-black uppercase text-slate-400 min-w-[200px]">Nom et Prénom de l&apos;élève :</span>
            </div>
            <div className="flex items-center gap-4 w-1/2 pb-4">
              <span className="text-xs font-black uppercase text-slate-400 min-w-[200px]">Classe :</span>
            </div>
          </div>
          <div className="space-y-4 mb-4">
             <div className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-6 h-6 border-2 border-blue-600 rounded flex-shrink-0 mt-0.5 group-hover:bg-blue-50"></div>
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase leading-tight">
                        J’autorise mon enfant à rencontrer M. Thomas Perez.
                    </p>
                    <p className="text-[12px] text-slate-500 font-bold italic leading-tight">
                        L&apos;entretien aura lieu uniquement si l&apos;enfant en fait la demande, ou si l&apos;équipe éducative (CPE, Professeur) en suggère la nécessité.
                    </p>
                </div>
             </div>
             <div className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-6 h-6 border-2 border-slate-300 rounded flex-shrink-0 mt-0.5 group-hover:bg-red-50"></div>
                <p className="text-xs font-bold uppercase text-slate-500 leading-tight">Je n’autorise pas mon enfant à consulter le psychologue scolaire.</p>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}
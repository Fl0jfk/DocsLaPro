"use client";

import Image from "next/image";

export default function FormulaireTelephone() {
  return (
    <div className="max-w-4xl mx-auto my-10 space-y-10 print:space-y-0 print:my-0 font-sans">
      <div className="bg-white p-10 border border-slate-200 shadow-xl min-h-[1100px] flex flex-col print:shadow-none print:border-none">
        
        {/* Header - Cohérent avec tes autres docs */}
        <div className="flex justify-between items-start border-b-4 border-blue-600 pb-4 mb-8">
          <div className="flex gap-6 items-center">
            <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" width={80} height={80} alt="Logo" />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900">La Providence Nicolas Barré</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Ensemble Scolaire (Collège - Lycée)</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="bg-blue-600 p-2 rounded-lg mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12" y2="18" />
                </svg>
            </div>
            <p className="text-lg font-black text-blue-600 leading-tight uppercase">Usage du Téléphone &<br/>Réseaux Sociaux</p>
          </div>
        </div>

        {/* 1. Identification */}
        <section className="mb-8 grid grid-cols-2 gap-8">
          <div className="border-b-2 border-slate-100 pb-2">
            <span className="text-[9px] font-black uppercase text-slate-400">Nom et Prénom de l&apos;élève :</span>
            <div className="h-6"></div>
          </div>
          <div className="border-b-2 border-slate-100 pb-2">
            <span className="text-[9px] font-black uppercase text-slate-400">Classe :</span>
            <div className="h-6"></div>
          </div>
          <div className="col-span-2 border-b-2 border-slate-100 pb-2">
            <span className="text-[9px] font-black uppercase text-slate-400">Nom du parent ou responsable légal :</span>
            <div className="h-6"></div>
          </div>
        </section>

        {/* 2. Le Questionnaire (Design épuré) */}
        <section className="space-y-6 mb-8">
          <h2 className="bg-slate-900 text-white px-4 py-2 text-xs font-black uppercase inline-block rounded-r-full">I. Équipement & Règlement</h2>
          
          <div className="space-y-4 px-2">
            {[
              "Mon enfant possède un téléphone portable personnel.",
              "Mon enfant apporte son téléphone portable au sein de l'établissement.",
              "J'ai pris connaissance du règlement intérieur (usage interdit dans l'enceinte de l'établissement)."
            ].map((question, index) => (
              <div key={index} className="flex justify-between items-center border-b border-slate-50 pb-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{question}</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-black"><div className="w-4 h-4 border-2 border-blue-600 rounded"></div> OUI</div>
                  <div className="flex items-center gap-2 text-[10px] font-black"><div className="w-4 h-4 border-2 border-blue-600 rounded"></div> NON</div>
                </div>
              </div>
            ))}
          </div>

          {/* Rappel des règles style "Alert Box" */}
          <div className="bg-slate-50 border-l-4 border-blue-600 p-6 rounded-r-xl">
            <p className="text-[10px] font-black uppercase text-blue-600 mb-3 underline">Rappel de la charte numérique :</p>
            <ul className="text-[10px] space-y-2 font-bold text-slate-600">
              <li className="flex gap-2"><span>•</span> Les téléphones sont collectés dès l&apos;arrivée et restitués en fin de journée.</li>
              <li className="flex gap-2"><span>•</span> Usage strictement interdit dans l&apos;enceinte de l&apos;établissement (bâtiments et cours).</li>
              <li className="flex gap-2"><span>•</span> En cas d&apos;infraction, des sanctions (retenues, confiscation) sont appliquées.</li>
            </ul>
          </div>
        </section>

        {/* 3. Réseaux Sociaux */}
        <section className="space-y-6 mb-8">
          <h2 className="bg-slate-900 text-white px-4 py-2 text-xs font-black uppercase inline-block rounded-r-full">II. Vie Numérique & Responsabilité</h2>
          
          <div className="space-y-6 px-2">
            <div className="flex justify-between items-start border-b border-slate-50 pb-4">
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight max-w-md">
                Mon enfant est actif sur les réseaux sociaux ou messageries (Snapchat, Instagram, WhatsApp, TikTok, Discord, etc.) :
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black"><div className="w-4 h-4 border-2 border-blue-600 rounded"></div> OUI</div>
                <div className="flex items-center gap-2 text-[10px] font-black"><div className="w-4 h-4 border-2 border-blue-600 rounded"></div> NON</div>
                <div className="flex items-center gap-2 text-[10px] font-black"><div className="w-4 h-4 border-2 border-blue-600 rounded"></div> NSP</div>
              </div>
            </div>

            <div className="flex justify-between items-start border-b border-slate-50 pb-4">
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight max-w-md">
                Je suis conscient(e) que l&apos;usage des réseaux sociaux en dehors du temps scolaire relève de ma seule responsabilité parentale :
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black"><div className="w-4 h-4 border-2 border-blue-600 rounded"></div> OUI</div>
                <div className="flex items-center gap-2 text-[10px] font-black"><div className="w-4 h-4 border-2 border-blue-600 rounded"></div> NON</div>
              </div>
            </div>
          </div>
        </section>

        {/* Info Box */}
        <div className="flex gap-4 items-center bg-blue-50 p-4 rounded-xl border border-blue-100 mb-8">
          <div className="text-xl">ℹ️</div>
          <p className="text-[9px] font-bold text-blue-800 leading-tight uppercase italic">
            Merci de signaler tout changement (acquisition d&apos;un nouveau téléphone, incident numérique...) via École Directe à Mme Vieira da Rosa pour le collège et Mr Yaici pour le lycée.
          </p>
        </div>
      </div>
    </div>
  );
}
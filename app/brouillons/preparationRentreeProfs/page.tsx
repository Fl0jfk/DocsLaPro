import Image from "next/image";

export default function PreparationRentreeProfs() {
  return (
    <div className="max-w-5xl mx-auto pt-8 pb-6 px-12  bg-white text-slate-800 font-sans shadow-2xl my-10 border border-slate-200" id="mon-flyer-a-imprimer">
      
      {/* HEADER : Logo et Date */}
      <header className="flex justify-start items-start mb-4 border-b-2 border-slate-900 pb-6">
        
          <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" width={100} height={100} alt="logo"/>
         
      </header>

      {/* TITRE PRINCIPAL */}
      <div className="text-center mb-4">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-2">Fiche de Vœux Individuelle</h1>
        <p className="text-blue-700 font-bold tracking-[0.2em] uppercase text-sm bg-blue-50 inline-block px-4 py-1 rounded">Enseignants • Rentrée 2026</p>
        <p className="text-[11px] font-bold text-red-500 uppercase mt-4 animate-pulse">À remettre aux secrétariats avant le 28/02/2026</p>
      </div>

      {/* SECTION 01 : IDENTITÉ */}
      <section className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2 lg:col-span-1 space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400">Nom Complet</label>
            <input type="text" className="w-full border-b-2 border-slate-200 focus:border-blue-600 outline-none py-1 font-semibold text-lg uppercase" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400">Adresse Actuelle</label>
            <input type="text" className="w-full border-b-2 border-slate-200 focus:border-blue-600 outline-none py-1 font-mono" />
          </div>
        </div>
        <div className="col-span-2 lg:col-span-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400">Téléphone Domicile</label>
              <input type="text" className="w-full border-b-2 border-slate-200 focus:border-blue-600 outline-none py-1 font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400">Contact Vacances</label>
              <input type="text" className="w-full border-b-2 border-slate-200 focus:border-blue-600 outline-none py-1" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400">Adresse Mail Professionnelle</label>
            <input type="email" className="w-full border-b-2 border-slate-200 focus:border-blue-600 outline-none py-1 text-blue-600 font-medium"/>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400">Discipline(s) Enseignée(s)</label>
            <input type="text" className="w-full border-b-2 border-slate-200 focus:border-blue-600 outline-none py-1 font-bold" />
          </div>
        </div>
      </section>

      {/* RAPPEL CONTRAT */}
      <div className="bg-slate-50 border-l-4 border-slate-900 p-4 mb-4 italic text-xs leading-relaxed text-slate-600">
        Les professeurs dont le contrat se termine à la fin de l’année scolaire 2025/2026 (suppléance, délégation sur heures vacantes) sont invités à formuler des vœux au cas où un service pourrait être reconduit ou intégré à leur contrat.
      </div>

      {/* SECTION 02 : FORMATION & CLASSES */}
      <section className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <h2 className="text-sm font-black uppercase border-b-2 border-slate-900 pb-2 mb-4 flex items-center gap-2">
            <span className="bg-slate-900 text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">01</span>
            Formation Personnelle
          </h2>
          <label className="text-xs text-slate-500 block mb-2 font-medium">Formations prévues ou souhaitées :</label>
          <textarea className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-blue-600 outline-none transition-all" rows={3}/>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase border-b-2 border-slate-900 pb-2 mb-4 flex items-center gap-2">
            <span className="bg-slate-900 text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">02</span>
            Vœux de Classes
          </h2>
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-4 italic">Cochez les classes souhaitées :</p>
          
          <div className="grid grid-cols-4 gap-2 mb-4">
            {['6ème', '5ème', '4ème', '3ème', '2nde GT', '1ère ST2S', 'Terminale ST2S', '1ère G', 'Terminale G'].map((classe) => (
              <label key={classe} className="flex items-center gap-2 border border-slate-100 p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-700">{classe}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 03 : EMPLOI DU TEMPS */}
      <section className="mb-4 pt-[45px]">
        <h2 className="text-sm font-black uppercase border-b-2 border-slate-900 pb-2 mb-4 flex items-center gap-2">
          <span className="bg-slate-900 text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">03</span>
          Configuration de l&apos;emploi du temps
        </h2>
        
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="bg-slate-50 px-4 py-2 rounded-2xl border flex items-center w-full border-slate-100">
            <label className="text-[10px] font-black uppercase text-slate-500 w-[45%]">Volume Horaire Actuel (25/26) :</label>
            <input type="text" className="w-full bg-transparent border-b border-slate-300 outline-none font-bold" />
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-2xl flex items-center w-full border border-slate-100">
            <label className="text-[10px] font-black uppercase text-slate-500 w-[38%]">Temps Complet Référence :</label>
            <input type="text" className="w-full bg-transparent border-b border-slate-300 outline-none font-bold" />
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-2xl flex items-center w-full border border-slate-100">
            <label className="text-[10px] font-black uppercase text-slate-500 w-[70%]">Temps partiel autorisé / de droit demandé :</label>
            <input type="text" className="w-full bg-transparent border-b border-slate-300 outline-none font-bold" />
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center w-full border border-blue-100">
            <label className="text-[10px] w-[35%] font-black uppercase text-blue-600">Heures Souhaitées (25/26) :</label>
            <input type="text" className="w-full bg-transparent border-b border-blue-300 font-black text-blue-700" />
          </div>
        </div>
        <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 items-center">
                {/* ENCART TITRE À GAUCHE */}
                <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-tighter leading-tight text-center">
                    Durée des cours<br/>souhaitée
                </span>
                </div>

                {/* LES TROIS CHOIX */}
                {["0 H 55", "1 H 22", "1 H 50"].map(duree => (
                <label key={duree} className="flex items-center justify-center gap-3 px-2 py-2 border-2 border-slate-50 rounded-xl hover:border-blue-200 transition-all cursor-pointer h-full">
                    <input type="radio" name="duree" className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-bold uppercase text-slate-700">{duree}</span>
                </label>
                ))}
            </div>
        </div>
      </section>
      <section className="mb-4 overflow-hidden border border-slate-200 rounded-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th className="p-4">Missions spécifiques</th>
              <th className="p-4 text-center">OUI</th>
              <th className="p-4 text-center">NON</th>
              <th className="p-4">Précisions (Niveau/Classe)</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {[
              { label: "Professeur Principal", sub: "Obligations, charges et avantages inclus" },
              { label: "Catéchèse / Formation humaine", sub: "Animation de groupe" },
              { label: "Aide Pastorale ponctuelle", sub: "1 fois/mois ou trimestre" },
              { label: "Heures Supplémentaires (HSE)", sub: "Accepte ou souhaite" },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2">
                  <p className="font-bold text-slate-800">{row.label}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase italic">{row.sub}</p>
                </td>
                <td className="px-4 py-2 text-center"><input type="radio" name={`row-${i}`} /></td>
                <td className="px-4 py-2 text-center"><input type="radio" name={`row-${i}`} /></td>
                <td className="px-4 py-2"><input type="text" className="w-full border-b border-slate-200 outline-none text-xs" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* SECTION 05 : SUGGESTIONS PRIORITAIRES */}
      <section className="mb-8 bg-blue-900 text-white p-8 pt-6 rounded-[2.5rem] shadow-xl">
        <h2 className="text-xl font-black uppercase mb-2 tracking-tight">Souhait Prioritaire & Suggestions</h2>
        <div className="grid grid-cols-1  gap-4 items-center">
          <div className="text-[11px] leading-relaxed space-y-2 opacity-80 italic">
            <p>• Le mercredi est un jour travaillé.</p>
            <p>• En raison de la complexification (Spécialités Lycée, Groupes Math/Français Collège), le souhait peut être refusé.</p>
          </div>
          <textarea 
            className="w-full bg-white/10 border-2 border-white/20 rounded-2xl p-4 text-white placeholder:text-white/30 outline-none focus:border-white/50 h-24"
          />
        </div>
      </section>

      {/* SIGNATURE AREA */}
      <footer className="mt-3 pt-3 border-t-2 border-slate-100 flex justify-between items-end">
        <div className="space-y-4">
           <div>
             <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Fait à</label>
             <input type="text" className="border-b border-slate-300 outline-none font-bold"  />
           </div>
           <div>
             <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Le</label>
             <input type="text" className="border-b border-slate-300 outline-none font-bold" />
           </div>
        </div>
        <div className="text-center space-y-4">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Signature de l&apos;enseignant</p>
           <div className="w-64 h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-200 italic text-xs">
           </div>
        </div>
      </footer>

    </div>
  );
}
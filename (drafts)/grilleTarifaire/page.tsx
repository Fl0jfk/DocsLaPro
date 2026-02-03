import Image from 'next/image';

export default function GrilleTarifaire ()  {
  return (
    <div className="max-w-[900px] mx-auto my-10 p-12 py-4 bg-white shadow-2xl border border-gray-200 text-slate-800 leading-tight font-sans" id='mon-flyer-a-imprimer'>
      <div className="flex justify-between items-end mb-4 border-b-2 border-slate-900 pb-4">
        <Image src={"/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp"} width={100} height={100} alt='Logo'/>
        <div className="text-right">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic text-nowrap">La Providence Nicolas Barré</h1>
          <p className="text-blue-600 font-black uppercase tracking-[0.2em] text-xs">Grille Tarifaire 2026/2027</p>
        </div>
      </div>
      <section className="mb-4">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 text-center">Enfants présents dans l&apos;établissement pour la rentrée 2026 - 2027 (par ordre de naissance)</h2>
  <div className="grid grid-cols-2 bg-black text-white text-[11px] font-bold uppercase rounded-t-lg border-x-2 border-t-2 border-black">
    <div className="p-3 border-r-2 border-white/20 text-center">Nom de l&apos;élève</div>
    <div className="p-3 text-center">Prénom de l&apos;élève</div>
  </div>
        <div className="border-2 border-black rounded-b-lg overflow-hidden bg-white">
            {[1, 2, 3, 4].map((i) => (
            <div 
                key={i} 
                className="grid grid-cols-2 border-b-2 last:border-b-0 border-black"
            >
                <input 
                type="text" 
                className="p-3 outline-none focus:bg-blue-50 border-r-2 border-black uppercase text-sm font-bold text-black" 
                style={{ borderRightColor: '#000000' }}
                />
                <input 
                type="text" 
                className="p-3 outline-none focus:bg-blue-50 text-sm font-bold text-black" 
                />
            </div>
            ))}
        </div>
        <div className="mt-4 flex items-center gap-4 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <label className="text-xs w-[30%] font-black text-slate-600 uppercase italic">
            Nom et prénom du payeur :
          </label>
          <input 
            type="text" 
            className="w-[70%] p-2 bg-white border-2 border-blue-600 rounded text-center font-black text-blue-600 outline-none"
          />
        </div>
      </section>
          <div className="mb-4 bg-red-50 border-2 border-red-600 p-4 rounded-lg flex items-start gap-4">
        <div className="bg-red-600 px-2 py-1 rounded text-white font-bold uppercase text-[10px] shrink-0">Important</div>
        <div className="text-red-700 text-xs leading-tight">
          <strong>JUSTIFICATIF OBLIGATOIRE :</strong> Si vous ne relevez pas de la <strong>Catégorie 1</strong>, vous devez impérativement joindre la photocopie de votre <strong>avis d&apos;imposition 2025 (sur les revenus 2024)</strong>. En l&apos;absence de ce document, le tarif de la Catégorie 1 vous sera attribué.
        </div>
      </div>
      <section className="mb-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-[10px] uppercase text-slate-500 tracking-widest">
          Données d&apos;imposition
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center gap-10">
            <div className='flex flex-col'>
                <span className="flex-1 text-xs font-medium"><strong>REVENU FISCAL DE RÉFÉRENCE</strong> (Avis 2025 sur revenus 2024)</span>
                <span className="text-[11px] font-medium italic">Inclure les revenus accessoires exonérés d&apos;impôt ainsi que les revenus perçus à l&apos;étranger non imposables en France.</span>
            </div>
            
            <div className="flex items-center bg-slate-50 border rounded px-3">
                <input 
                   
                    className="w-32 p-2 bg-transparent text-right font-bold outline-none text-sm"
                />
                <span className="ml-2 text-slate-400 font-bold text-xs">€</span>
            </div>
          </div>
          <div className="flex justify-between items-center gap-10">
            <span className="flex-1 text-xs font-medium"><strong>NOMBRE DE PERSONNES AU FOYER</strong> ( Toujours 2 Parents + enfants à charge fiscalement)</span>
            <input 
        
              className="w-40 p-2 bg-slate-50 border rounded text-right font-bold outline-none text-sm text-center"
            />
          </div>
        </div>
      </section>

      {/* RÉSULTATS ET GRILLE */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <table className="w-full text-[11px] border border-slate-200 rounded-lg overflow-hidden border-collapse shadow-sm">
            <thead>
              <tr className="bg-slate-800 text-white uppercase text-[11px]">
                <th className="p-3 text-left pl-4">Tranches Quotient Familial</th>
                <th className="p-3 text-center border-l border-slate-700">Cat.</th>
              </tr>
            </thead>
            <tbody>
              {[
                { l: "Supérieur à 14 660 €", c: 1 },
                { l: "De 10 930 € à 14 660 €", c: 2 },
                { l: "De 6 920 € à 10 930 €", c: 3 },
                { l: "De 4 610 € à 6 920 €", c: 4 },
                { l: "Inférieur à 4 610 €", c: 5 }
              ].map((r) => (
                <tr key={r.c}>
                  <td className="p-2.5 pl-4 italic">{r.l}</td>
                  <td className="p-2.5 text-center border-l border-slate-100">{r.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl shadow-inner border border-slate-200">
  <div className="grid grid-cols-1 gap-4">
    <div className="text-center">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-2">Quotient Familial Annuel</span>
      <div className="text-3xl font-bold text-slate-800 tabular-nums h-7">
      </div>
    </div>
    <div className="flex items-center justify-center">
      <div className="h-[1px] w-full bg-slate-200"></div>
      <div className="px-3 text-slate-300 text-xs">▼</div>
      <div className="h-[1px] w-full bg-slate-200"></div>
    </div>
    <div className="text-center bg-white p-3 rounded-xl shadow-sm border border-blue-50">
      <span className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em] block mb-2">Catégorie de Tarif</span>
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm text-slate-400 font-medium h-7 italic"></span>
      </div>
    </div>
  </div>
</div>
      </div>
      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
         <p className="text-[9px] text-slate-500 italic leading-snug">Ce document est une simulation établie sous réserve de validation définitive par le service comptabilité de l&apos;établissement après réception et vérification de votre avis d&apos;imposition.</p>
      </div>
    </div>
  );
};
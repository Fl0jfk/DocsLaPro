import Image from "next/image";
import logoEcole from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";

export default function FicheTransport() {
  return (
    <div className="max-w-4xl mx-auto my-10 print:my-0 font-sans">
      <div className="bg-white p-10 border border-slate-200 shadow-xl min-h-[1100px] flex flex-col print:shadow-none print:border-none">
        <div className="flex justify-between items-start border-b-4 border-blue-600 pb-4 mb-4">
          <div className="flex gap-6 items-center">
            <Image src={logoEcole} width={90} height={90} alt="Logo École" unoptimized priority />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">La Providence Nicolas Barré</h1>
              <p className="text-sm font-bold text-slate-500 uppercase">6, rue de Neuvillette 76240 LE MESNIL ESNARD</p>
              <span className="text-sm font-bold text-slate-500 uppercase">02-32-86-50-90</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="bg-blue-600 text-white px-3 py-1 rounded mb-2 font-black text-xs">TRANSPORT</div>
            <p className="text-xl font-black text-blue-600 uppercase">Navette Gare SNCF</p>
            <p className="text-sm font-bold uppercase text-slate-500 italic">Année 2026/2027</p>
          </div>
        </div>
        <section className="mb-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-4">Note d&apos;information et inscription</h2>
          <div className="bg-slate-50 border-l-4 border-blue-600 p-4 rounded-r-xl mb-6">
            <p className="text-sm leading-relaxed text-slate-700">
              Chers parents, un service de navette est mis en place pour l&apos;année scolaire <span className="font-bold">2026-2027</span> afin de permettre aux élèves arrivant à la gare SNCF de Rouen de rejoindre l&apos;établissement pour 8h30.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { title: "Départ", desc: "8h10 précise, devant la gare SNCF (arrêts autocars)." },
              { title: "Moyen", desc: "Taxi (prestataire agréé)." },
              { title: "Période", desc: "Dès le 7 sept. 2026, toute l'année scolaire." },
              { title: "Capacité", desc: "15 places disponibles (ordre d'inscription)." }
            ].map(item => (
              <div key={item.title} className="border border-slate-100 p-3 rounded-lg">
                <p className="font-black text-blue-700 uppercase text-[12px] mb-1">{item.title}</p>
                <p className="font-bold text-slate-800 text-[12px]">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-red-50 border-2 border-red-100 p-4 rounded-xl flex gap-4 items-center mb-1">
            <div className="text-2xl">⚠️</div>
            <div>
              <p className="text-[15px] font-black text-red-700 uppercase mb-1">Tarif : 160 € / an</p>
              <p className="text-[12px] text-red-900 font-bold leading-tight italic">
                Forfait fixe réparti sur les factures annuelles. L&apos;inscription vaut engagement ferme pour toute l&apos;année scolaire. Aucun ajustement possible.
                <br/>Le calendrier des jours de transport vous sera communiqué ultérieurement.
              </p>
            </div>
          </div>
        </section>
        <section className="flex-1">
          <h2 className="bg-blue-600 text-white px-4 py-2 text-sm font-black uppercase mb-8 inline-block rounded-r-full">Coupon-réponse : Autorisation de transport</h2>
          <div className="space-y-8">
            <div>
              <p className="text-sm font-bold mb-6">Je soussigné(e) M. / Mme : <span className="font-mono border-b border-slate-300 inline-block w-64 h-5"></span></p>
              <div className="grid grid-cols-2 gap-8">
                <p className="text-sm font-bold">Parent(s) de l&apos;élève : <span className="font-mono border-b border-slate-300 inline-block w-48 h-5"></span></p>
                <p className="text-sm font-bold">Classe : <span className="font-mono border-b border-slate-300 inline-block w-48 h-5"></span></p>
              </div>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
              <p className="text-sm font-bold leading-relaxed">Autorise mon enfant à utiliser la navette Gare SNCF / La Providence (8h10) pour l&apos;année 2026-2027 aux conditions de la note d&apos;information ci-dessus (Forfait 160€ avec engagement annuel).</p>
            </div>
            <div className="grid grid-cols-2 gap-10 items-end pt-10">
              <div className="space-y-4">
                <p className="text-xs font-bold italic">Fait à ....................................., le ....................................</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Signature précédée de la mention "Lu et approuvé"</p>
              </div>
              <div className="text-center">
                <div className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 italic text-[10px] uppercase font-black">Cadre Signature</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
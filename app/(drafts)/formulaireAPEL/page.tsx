import Image from "next/image";
import logoEcole from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";
import logoApel from "../../../public/APEL_Logo_Small-160x120.png";

export default function FormulaireAPEL() {
  return (
    <div className="max-w-4xl mx-auto my-10 space-y-10 print:space-y-0 print:my-0">
      <div className="bg-white p-10 border border-slate-200 shadow-xl min-h-[1100px] flex flex-col print:shadow-none print:border-none">
        <div className="flex justify-between items-start border-b-4 border-blue-600 pb-2 mb-4">
          <div className="flex gap-6 items-center">
            <Image src={logoEcole} width={90} height={90} alt="Logo École" unoptimized priority />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">La Providence Nicolas Barré</h1>
              <p className="text-sm font-bold text-slate-500 uppercase">6, rue de Neuvillette 76240 LE MESNIL ESNARD</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
             <Image src={logoApel} width={100} height={75} alt="Logo APEL" unoptimized priority />
             <p className="text-xs font-black text-slate-900 uppercase mt-2">Participation à la vie de l'établissement</p>
          </div>
        </div>
        <section className="mb-4">
          <h2 className="bg-slate-900 text-white px-4 py-2 text-sm font-black uppercase mb-4 inline-block rounded-r-full">1. Parent bénévole</h2>
          <p className="text-[10px] text-slate-500 mb-4 italic">(Remplir une fiche par parent bénévole – Mais chaque famille n’a qu’une voix lors des votes.)</p>
          <div className="grid grid-cols-2 gap-8 mb-4">
            <div className="flex items-end gap-2 border-b-2 border-slate-100 pb-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Nom :</span>
              <div className="flex-1"></div>
            </div>
            <div className="flex items-end gap-2 border-b-2 border-slate-100 pb-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Prénom :</span>
              <div className="flex-1"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-end gap-2 border-b-2 border-slate-100 pb-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Email :</span>
              <div className="flex-1"></div>
            </div>
            <div className="flex items-end gap-2 border-b-2 border-slate-100 pb-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Tél portable :</span>
              <div className="flex-1"></div>
            </div>
          </div>
        </section>
        <section className="mb-4">
          <h2 className="bg-slate-900 text-white px-4 py-2 text-sm font-black uppercase mb-4 inline-block rounded-r-full">2. Vos enfants</h2>
          <div className="border-2 border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                <tr>
                  <th className="p-3 border-b border-slate-100">Nom</th>
                  <th className="p-3 border-b border-slate-100">Prénom</th>
                  <th className="p-3 border-b border-slate-100 text-center">Classe</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-slate-50 h-10">
                    <td className="p-3"></td><td className="p-3"></td><td className="p-3"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="mb-4">
          <h2 className="bg-blue-600 text-white px-4 py-2 text-sm font-black uppercase mb-4 inline-block rounded-r-full">3. Sollicitations de l'établissement</h2>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
            <p className="text-xs font-black text-blue-800 uppercase mb-2">L’établissement pourrait-il vous solliciter pour :</p>
            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 rounded bg-white mt-1 flex-shrink-0"></div>
                <span className="text-[11px] font-bold text-slate-700">AIDER PONCTUELLEMENT À DES ACTIVITÉS DANS LA CLASSE (MATERNELLES)</span>
              </label>
              <label className="flex items-start gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 rounded bg-white mt-1 flex-shrink-0"></div>
                <span className="text-[11px] font-bold text-slate-700">ACCOMPAGNER LES ÉLÈVES LORS DE SORTIES SCOLAIRES (MATERNELLES ET PRIMAIRE)</span>
              </label>
              <label className="flex items-start gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 rounded bg-white mt-1 flex-shrink-0"></div>
                <span className="text-[11px] font-bold text-slate-700 leading-tight">
                  AIDER DANS LE DOMAINE DE L’ANIMATION PASTORALE (CATÉCHÈSE EN PRIMAIRE OU COLLÈGE, FORMATION HUMAINE ET CHRÉTIENNE AU LYCÉE, AIDE POUR LES TEMPS FORTS, …)
                </span>
              </label>
            </div>
          </div>
        </section>
        <section className="flex-1">
          <h2 className="bg-slate-900 text-white px-4 py-2 text-sm font-black uppercase mb-4 inline-block rounded-r-full">4. Implication au sein de l'APEL</h2>
          <div className="bg-slate-50 px-6 rounded-2xl border border-slate-200 text-justify mb-4 py-4">
            <p className="text-[10px] leading-relaxed text-slate-600">
              Par sa <strong>cotisation volontaire à l’APEL</strong> (Association de Parents d’élèves de l’Enseignement Libre), chaque famille est adhérente à l’association et contribue au dynamisme de l’établissement. Si vous souhaitez vous impliquer davantage (commissions, temps forts tels que le Marché de Noël ou la Kermesse, …), n’hésitez pas à rejoindre l’équipe d’animation que vous pourrez rencontrer aux cafés d’accueil de rentrée ou lors de l’assemblée générale de l’association début octobre.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <label className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-slate-900 rounded flex-shrink-0"></div>
              <span className="text-[11px] font-black uppercase">Je souhaite être membre du conseil d’administration (4 à 5 réunions de CA par an)</span>
            </label>
            <label className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-slate-900 rounded flex-shrink-0"></div>
              <span className="text-[11px] font-black uppercase">Je souhaite aider ponctuellement sans être membre du CA : Marché de Noël, jeux du carême, kermesse de fin d’année, …</span>
            </label>
          </div>
        </section>
      </div>
      <div className="bg-white p-10 border border-slate-200 shadow-xl min-h-[1100px] flex flex-col print:shadow-none print:border-none print:break-before-page">
        <section className="mb-8">
          <h2 className="bg-blue-600 text-white px-4 py-2 text-sm font-black uppercase mb-6 inline-block rounded-r-full">5. Le Parent Correspondant</h2>
          <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-600 mb-6">
            <p className="text-xs font-bold text-blue-900 mb-4 italic">Au début de l’année scolaire, chaque classe choisit des parents correspondants. Le parent correspondant :</p>
            <ul className="space-y-4">
              <li className="flex gap-4 items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                <p className="text-xs text-slate-700"><strong>Représente tous les parents dans leur diversité :</strong> il est le porte-parole de toutes les familles de la classe, notamment lors des conseils de classe.</p>
              </li>
              <li className="flex gap-4 items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                <p className="text-xs text-slate-700"><strong>Est un médiateur :</strong> il assure le lien entre les familles et l’équipe éducative, l’APEL, etc.</p>
              </li>
              <li className="flex gap-4 items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                <p className="text-xs text-slate-700"><strong>Est à la disposition des familles et à leur écoute.</strong></p>
              </li>
            </ul>
          </div>
          <div className="bg-red-50 border-2 border-red-600 p-6 rounded-2xl">
            <p className="text-xs font-black text-red-600 uppercase mb-4 text-center">
              Si vous souhaitez être parent correspondant merci de le faire savoir par email AVANT LE 25 AOÛT aux secrétariats concernés :
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm text-center">
                <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Collège</p>
                <p className="text-sm font-mono font-black text-slate-900">0762565a@ac-normandie.fr</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm text-center">
                <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Lycée</p>
                <p className="text-sm font-mono font-black text-slate-900">0761713z@ac-normandie.fr</p>
              </div>
            </div>
          </div>
        </section>
        <section className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200">
           <p className="text-xs font-bold text-slate-700 mb-2">Pour toute question ou information sur l’APEL, n’hésitez pas à nous contacter :</p>
           <p className="text-lg font-black text-blue-600 underline">info@apelprovidence.fr</p>        
        </section>
      </div>
    </div>
  );
}
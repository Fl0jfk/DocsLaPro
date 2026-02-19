"use client";

import Image from "next/image";
import Logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp"

export default function ConventionStageAeree() {
  return (
    <div className="flex flex-col items-center bg-slate-100 py-10 print:bg-white print:py-0">
      <div className="bg-white p-[15mm] border border-slate-200 shadow-xl w-[210mm] min-h-[297mm] flex flex-col mb-4 print:mb-0 print:shadow-none print:border-none">
        <div className="flex justify-between items-start border-b-4 border-blue-600 pb-2 mb-4">
          <div className="flex gap-6 items-center">
            <Image  src={Logo} width={100}  height={100}  alt="Logo"/>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">La Providence</h1>
              <p className="text-xl font-bold text-blue-600 uppercase tracking-tight">Nicolas Barré</p>
              <div className="mt-2 text-[11px] font-bold text-slate-500 uppercase">
                <p>6, rue de Neuvillette 76240 LE MESNIL ESNARD</p>
                <p>Tél : 02-32-86-50-90</p>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="bg-blue-600 p-3 rounded-2xl mb-2 shadow-md">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
            </div>
            <p className="text-2xl font-black text-blue-600 leading-none uppercase tracking-tighter">Convention de stage</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mt-1 italic">Page 1 / 3</p>
          </div>
        </div>
        <section className="space-y-4 mb-4">
          <h2 className="bg-slate-900 text-white px-6 py-1 text-xs font-black uppercase inline-block rounded-r-full tracking-widest">1. Cadre de l&apos;accueil (Entreprise & Tuteur)</h2>
          <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase text-blue-600 min-w-[120px]">Organisme :</span>
                <div className="flex-1 border-b border-slate-300 h-6"></div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase text-blue-600 min-w-[120px]">Adresse complète :</span>
                <div className="flex-1 border-b border-slate-300 h-6"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase text-blue-600">SIRET :</span>
                  <div className="flex-1 border-b border-slate-300 h-6"></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase text-blue-600">Tuteur :</span>
                  <div className="flex-1 border-b border-slate-300 h-6"></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase text-blue-600">N° de tél :</span>
                  <div className="flex-1 border-b border-slate-300 h-6"></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase text-blue-600">Mail :</span>
                  <div className="flex-1 border-b border-slate-300 h-6"></div>
                </div>
              </div>
            </div>
          </div>
          <h2 className="bg-slate-900 text-white px-6 py-1 text-xs font-black uppercase inline-block rounded-r-full tracking-widest">2. Bénéficiaire (Élève)</h2>
          <div className="bg-blue-50/30 p-6 rounded-[32px] border-2 border-blue-100 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase text-blue-600 min-w-[120px]">Nom & Prénom :</span>
                <div className="flex-1 border-b border-blue-200 h-6 font-bold text-slate-800"></div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase text-blue-600">Classe :</span>
                  <div className="flex-1 border-b border-blue-200 h-6"></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase text-blue-600">Téléphone :</span>
                  <div className="flex-1 border-b border-blue-200 h-6"></div>
                </div>
              </div>
            </div>
          </div>
          <h2 className="bg-slate-900 text-white px-6 py-1 text-xs font-black uppercase inline-block rounded-r-full tracking-widest">3. Organisation du stage (Dates et Horaires)</h2>
          <div className="bg-emerald-50/30 p-6 rounded-[32px] border-2 border-emerald-100 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase text-emerald-600 min-w-[60px]">Dates :</span>
                <div className="flex-1 border-b border-emerald-200 h-6"></div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-emerald-600">Horaires détaillés (indiquer les jours et heures) :</span>
                <div className="w-full border-2 border-dashed border-emerald-200 rounded-xl h-24 bg-white/50 p-2 text-xs text-slate-600 italic"></div>
              </div>
            </div>
          </div>
        </section>
        <section className="text-[14px] text-slate-700 leading-relaxed space-y-4 text-justify">
          <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 1 – Objet de la convention :</span> La présente convention a pour objet la mise en oeuvre, au bénéfice de l’élève désigné, d’une séquence d’observation en milieu professionnel réalisée dans le cadre de sa formation scolaire.</p>
          <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 2 – Dispositions de la convention :</span> La convention doit être signée par : le chef d’établissement, le représentant de l’entreprise ou de l’organisme d’accueil, l’élève, et, s’il est mineur, son représentant légal, ainsi que le maître de stage chargé du suivi de l’élève.</p>
        </section>
      </div>
      <div className="bg-white p-[20mm] border border-slate-200 shadow-xl w-[210mm] min-h-[297mm] flex flex-col mb-10 print:mb-0 print:shadow-none print:border-none">
        <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4 mb-10 text-slate-400 uppercase font-black text-xs tracking-widest">
          <span>Convention de Stage - La Providence</span>
          <span>Page 2 / 3</span>
        </div>
        <section className="text-[14px] text-slate-700 leading-relaxed space-y-4 text-justify">
          <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 3 – Finalité de la séquence d’observation :</span> La séquence d’observation vise à sensibiliser l’élève à l’environnement technologique, économique et professionnel, en lien avec les programmes d’enseignement et l’éducation à l’orientation.</p>
          <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 4 – Accueil et suivi de l’élève :</span> L’organisation de la séquence est déterminée d’un commun accord entre le responsable de l’organisme d’accueil et le chef d’établissement scolaire.</p>
          <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 5 – Statut de l’élève :</span> Pendant toute la séquence d’observation, l’élève conserve son statut scolaire et reste sous l’autorité du chef d’établissement. Il demeure soumis au règlement intérieur du collège et ne peut prétendre à aucune rémunération.</p>
          <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 6 – Tâches confiées et obligations :</span> L’élève n’a pas à concourir directement au travail de l’entreprise. Il peut réaliser des enquêtes en lien avec ses enseignements et être associé à certaines activités, à visée pédagogique uniquement. Le maître de stage et le professeur référent veillent au bon déroulement de la séquence. L’élève doit respecter les règles de sécurité, d’horaires et de discipline. Il est tenu au secret professionnel et à la discrétion : aucun renseignement confidentiel ne peut apparaître dans son rapport de stage.</p>
          <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 7 – Durée et horaires :</span> La durée maximale de présence est : 30 heures hebdomadaires pour les élèves de moins de 15 ans, 35 heures pour les élèves de plus de 15 ans. La durée quotidienne ne peut excéder 7 heures. Une pause d’au moins 30 minutes est obligatoire au-delà de 4h30 d’activité. Repos minimal : 14 heures consécutives par tranche de 24h, et 2 jours par semaine.</p>
            <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 8 – Sécurité et travaux interdits :</span> L’élève ne peut en aucun cas accéder aux machines, appareils ou produits interdits aux mineurs par le Code du travail (articles L4153-8 et D4153-15 à D4153-37).</p>
          <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 9 – Assurances et responsabilité civile :</span> L’organisme d’accueil garantit sa responsabilité civile vis-à-vis de l’élève. Le chef d’établissement assure la couverture responsabilité civile de l’élève pour les dommages qu’il pourrait causer. Référence assurance : Mutuelles Saint-Christophe assurances – Police n° 0020850051435787 277 rue Saint Jacques – 75256 Paris cedex 05.</p>
             <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 10 – Lieu et couverture accidents :</span> La séquence se déroule dans les locaux de l’organisme d’accueil. En cas d’accident, l’organisme d’accueil doit déclarer l’incident au chef d’établissement dans les 24 heures. L’élève doit utiliser des moyens de transport sûrs pour se rendre sur le lieu du stage.</p>
          <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 11 – Difficultés en cours de stage :</span> Tout problème doit être signalé sans délai. Le chef d’établissement peut rompre immédiatement la convention en cas de danger pour l’élève.</p>
        </section>
      </div>
      <div className="bg-white p-[20mm] border border-slate-200 shadow-xl w-[210mm] min-h-[297mm] flex flex-col mb-4 print:mb-0 print:shadow-none print:border-none">
        <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4 mb-10 text-slate-400 uppercase font-black text-xs tracking-widest">
          <span>Convention de Stage - La Providence</span>
          <span>Page 3 / 3</span>
        </div>
        <section className="text-[14px] text-slate-700 leading-relaxed space-y-8 text-justify">
          <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 12 – Durée de validité :</span> La présente convention est conclue uniquement pour la durée de la séquence d’observation mentionnée.</p>
          <p><span className="font-black text-slate-900 uppercase tracking-tight">Article 13 – Protection des données (RGPD) :</span> Les données sont traitées par l’établissement scolaire. Chaque personne dispose d’un droit d’accès et de rectification auprès de la cheffe d’établissement : Anne-Marie DONA.</p>
        </section>
        <div className="flex-1 flex flex-col justify-center mt-[-300px]">
            <div className="border-4 border-blue-600 rounded-[60px] overflow-hidden bg-white shadow-2xl">
                <div className="bg-blue-600 text-white text-center py-4 font-black uppercase text-sm tracking-[0.3em]">Signatures des parties</div>
                <div className="grid grid-cols-3">
                    <div className="p-8 border-r-2 border-blue-50 min-h-[250px] flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400 mb-4">L&apos;Organisme d&apos;accueil</span>
                        <div className="flex-1 border-2 border-dashed border-slate-100 rounded-[30px] bg-slate-50/50"></div>
                    </div>
                    <div className="p-8 border-r-2 border-blue-50 min-h-[250px] flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400 mb-4">Représentant légal</span>
                        <div className="flex-1 border-2 border-dashed border-slate-100 rounded-[30px] bg-slate-50/50"></div>
                    </div>
                    <div className="p-8 min-h-[250px] flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400 mb-4">L&apos;Élève</span>
                        <div className="flex-1 border-2 border-dashed border-slate-100 rounded-[30px] bg-slate-50/50"></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
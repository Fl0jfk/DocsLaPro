"use client"

import Image from "next/image";
import Logo from "../../../public/Logo La Providence Bien Etre.png"
import SoutienPsyImage from "../../../public/Psychologue.jpg"
import SuiviSanteImage from "../../../public/Infirmière.jpg"
import MediationAnimaleImage from "../../../public/Médiation animale.jpg"
import Thomas from "../../../public/Thomas.jpg"

export default function DepliantProvidenceRecto() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-[#cfcfd8] p-10">
      <section id="mon-flyer-a-imprimer" className="relative w-[297mm] h-[210mm] bg-white overflow-hidden shadow-2xl flex">
        <div className="absolute top-0 left-[99mm] w-[1px] h-full bg-gray-200 z-[100] border-dashed border-l" />
        <div className="absolute top-0 left-[198mm] w-[1px] h-full bg-gray-200 z-[100] border-dashed border-l" />
        <div className="w-[99mm] h-full relative p-10 flex flex-col justify-between bg-slate-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#18aae2]/5 rounded-full blur-3xl z-0" />
        <div className="relative z-10 h-full flex flex-col justify-center py-12">
          <div className="mb-12">
            <p className="text-gray-700 text-lg leading-relaxed font-medium">
              Dans un établissement scolaire, le bien-être devient un <span className="text-[#18aae2] font-black italic">pilier du projet éducatif</span>. 
              Il ne s&apos;agit pas seulement de performance scolaire mais de :
            </p>
          </div>
          <ul className="space-y-8 mb-12">
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#fbb800] mt-2.5" />
              <p className="text-gray-800 text-lg font-bold leading-tight">Formé des élèves équilibrés</p>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#18aae2] mt-2.5" />
              <p className="text-gray-800 text-lg font-bold leading-tight">Développer leur intelligence émotionnelle</p>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#e94f8a] mt-2.5" />
              <p className="text-gray-800 text-lg font-bold leading-tight">Prévenir les difficultés</p>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-black mt-2.5" />
              <p className="text-gray-800 text-lg font-bold leading-tight">Favoriser un climat scolaire serein</p>
            </li>
          </ul>
        <div className="mt-8 p-6 bg-white/50 rounded-3xl border border-white shadow-sm">
          <p className="text-gray-600 text-lg italic text-center leading-snug">
            Parce qu&apos;un élève <span className="text-[#e94f8a] font-black">serein</span> est plus disponible pour <span className="font-bold text-gray-800">apprendre et s&apos;épanouir</span>.
          </p>
        </div>
      </div>
    </div>
    <div className="w-[99mm] h-full relative p-8 flex flex-col items-center bg-white overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#18aae2]/5 z-0" />
      <div className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full bg-[#e94f8a]/5 z-0" />
      <div className="relative z-10 w-full flex flex-col h-full">
        <div className="text-center mb-10 mt-4">
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-none">
            Vos <span className="text-[#18aae2]">Intervenants</span>
          </h2>
          <div className="w-10 h-1 bg-[#fbb800] mx-auto mt-3 rounded-full"></div>
        </div>
        <div className="w-full flex flex-col gap-15 flex-grow justify-start">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-slate-100 border-2 border-[#18aae2] overflow-hidden shadow-inner">
              <Image src={Thomas} alt="Thomas Perez" className="w-full h-full object-cover" width={80} height={80} />
            </div>
            <div className="flex-grow">
              <p className="text-[#18aae2] text-[9px] font-black uppercase tracking-[0.15em]">Psychologue</p>
              <h3 className="text-gray-800 font-bold text-xl">Thomas Perez</h3>
              <div className="mt-2 space-y-0.5">
                <p className="text-gray-500 text-[11px] leading-tight">
                  <span className="font-bold text-gray-700">Lun, Mar, Jeu, Ven</span>
                </p>
                <p className="text-gray-400 text-[11px] font-medium italic">8h30 — 14h00</p>
              </div>
            </div>
          </div>
          <div className="w-full h-px bg-gray-100 mx-auto"/>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-20 h-20 rounded-full bg-slate-100 border-2 border-[#e94f8a] overflow-hidden shadow-inner">
                <Image src="/photo-ludmila.jpg" alt="Ludmila Berbra" className="w-full h-full object-cover" width={80} height={80} />
              </div>
              <div className="flex-grow">
                <p className="text-[#e94f8a] text-[9px] font-black uppercase tracking-[0.15em]">Infirmière</p>
                <h3 className="text-gray-800 font-bold text-xl">Ludmila Berbra</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-500 text-[11px] leading-tight">
                    <span className="font-bold text-gray-700">Lun, Mar, Jeu, Ven :</span> 8h30-13h30; 14h30-16h30
                  </p>
                  <p className="text-gray-500 text-[11px] leading-tight">
                    <span className="font-bold text-gray-700">Mercredi :</span> 8h30-12h30
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full h-px bg-gray-100 mx-auto"/>
              <div className="flex flex-col gap-3">
                <p className="text-[#fbb800] text-[9px] font-black uppercase tracking-[0.15em] mb-1">Médiation Animale — Mercredi Matin</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-[#fbb800] overflow-hidden mb-2">
                      <Image src="/photo-hoppa.jpg" alt="Hopa" className="w-full h-full object-cover" width={64} height={64} />
                    </div>
                    <h4 className="text-gray-800 font-bold text-sm">Hopa</h4>
                    <p className="text-[#18aae2] text-[10px] font-bold uppercase mt-1">Collège</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-[#fbb800] overflow-hidden mb-2">
                      <Image src="/photo-pepsi.jpg" alt="Pepsi" className="w-full h-full object-cover" width={64} height={64} />
                    </div>
                    <h4 className="text-gray-800 font-bold text-sm">Pepsi</h4>
                    <p className="text-[#e94f8a] text-[10px] font-bold uppercase mt-1">Lycée</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-[99mm] h-full relative flex flex-col items-center bg-white p-8 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#18aae2]/10 z-0" />
          <div className="absolute -bottom-20 -right-10 w-60 h-60 rounded-full bg-[#fbb800]/10 z-0" />
          <div className="relative z-10 w-full flex flex-col items-center h-full">
            <div className="text-center mt-6">
              <h2 className="text-[#18aae2] text-3xl font-black italic uppercase leading-tight tracking-tighter">
                Le bien-être <br />
                <span className="text-[#e94f8a]">à l'école</span>
              </h2>
              <p className="mt-2 text-[#fbb800] font-bold text-lg italic uppercase tracking-widest">
                Écouter • Soigner • Apaiser
              </p>
              <div className="w-16 h-1 bg-gray-200 mx-auto mt-4 rounded-full"></div>
            </div>
            <p className="mt-8 text-center text-sm text-gray-600 font-medium leading-relaxed max-w-[240px]">
              Un accompagnement complet pour l'épanouissement de chaque élève, au cœur de notre projet pédagogique.
            </p>
            <div className="w-full grid grid-cols-3 gap-3 mt-8">
              <div className="flex flex-col items-center">
                <div className="h-8 flex items-center justify-center mb-3">
                  <p className="font-bold text-gray-800 text-[11px] uppercase tracking-tight leading-tight text-center">
                    Soutien psychologique
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center w-full">
                  <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden mt-auto p-3">
                    <Image src={SoutienPsyImage} alt="Soutien psychologique" className="w-full h-full object-cover rounded-lg transform scale-200 -translate-y-2" width={400} height={400} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-8 flex items-center justify-center mb-3">
                  <p className="font-bold text-gray-800 text-[11px] uppercase tracking-tight leading-tight text-center">
                    Suivi de santé
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center w-full">
                  <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden mt-auto p-3">
                    <Image src={SuiviSanteImage} alt="Suivi de santé" className="w-full h-full object-cover rounded-lg transform scale-200 -translate-y-3" width={400} height={400} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-8 flex items-center justify-center mb-3">
                  <p className="font-bold text-gray-800 text-[11px] uppercase tracking-tight leading-tight text-center">
                    Médiation animale
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center w-full">
                  <div className="w-full aspect-square rounded-xl overflow-hidden mt-auto">
                    <Image src={MediationAnimaleImage} alt="Médiation animale" className="w-full h-full object-cover rounded-lg transform scale-150 -translate-y-3" width={400} height={400} />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-[#18aae2] font-black italic text-lg leading-tight uppercase">
                S'épanouir et réussir <br />
                <span className="text-gray-400">en confiance</span>
              </p>
            </div>
            <div className="mt-10 pb-4 max-h-[150px] max-w-[140px]">
              <Image src={Logo} width={350} height={350}  alt="Logo La Providence" className="opacity-90 hover:opacity-100 transition-opacity"/>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
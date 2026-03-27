"use client";

import Image from "next/image";
import { SCHOOL } from "../../lib/school";

export default function PartnerTennisPage() {
  const ETPE = {
    name: "Entente Tennis du Plateau Est",
    shortName: "ETPE",
    slogan: "Le Tennis s'adapte à Tous",
    location: { city: "Le Mesnil-Esnard", place: "SIVOM (Rue Pierre de Coubertin)" },
    contact: {
      alban: "06 24 04 48 68",
      email: "contact@etpe.net"
    },
    url: "https://etpe.net/"
  };

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center py-10 px-4 print:p-0 print:bg-white no-scrollbar">
      {/* ── BOUTON IMPRESSION ── */}
      <button 
        onClick={() => window.print()}
        className="mb-8 px-6 py-3 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-all print:hidden flex items-center gap-2"
      >
        <span>🖨️</span> Imprimer l'affiche (A4)
      </button>

      {/* ── A4 PAGE CONTAINER ── */}
      <div className="bg-white shadow-2xl w-[210mm] h-[297mm] overflow-hidden flex flex-col relative print:shadow-none print:w-full print:h-full border border-slate-100 print:border-none">
        
        {/* ── HEADER ── */}
        <div className="px-10 py-4 flex justify-between items-center border-b-[6px] border-lime-500">
          <div className="flex items-center gap-6">
            <Image 
              src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png" 
              alt="Logo La Providence" 
              width={65} 
              height={65} 
            />
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                {SCHOOL.shortName}
              </h1>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Éducation · Valeurs · Sport
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Image 
              src="/Etpe.png" 
              alt="Logo ETPE" 
              width={160} 
              height={80} 
              className="object-contain h-20 w-auto"
            />
          </div>
        </div>

        {/* ── MAIN BANNER ── */}
        <div className="relative h-[70mm] overflow-hidden bg-slate-800">
          <Image 
            src="/Tennis.jpg" 
            alt="Tennis Court" 
            fill 
            style={{ objectPosition: 'center center' }}
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent" />
          
          <div className="absolute bottom-10 left-10 right-10">
            <span className="bg-lime-400 text-lime-950 text-[12px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-sm inline-block mb-4 shadow-lg">
              Partenariat Sportif
            </span>
            <h2 className="text-7xl font-black text-white leading-[0.8] tracking-tighter drop-shadow-2xl">
              SECTION <br />
              <span className="text-lime-400 italic font-black">TENNIS CLUB</span>
            </h2>
          </div>
        </div>

        {/* ── CONTENT GRID ── */}
        <div className="px-10 py-[22px] grid grid-cols-2 gap-12 flex-1">
          
          {/* LEFT COL: Project & Planning */}
          <div className="space-y-4">
            <section>
              <h3 className="text-xl font-black text-slate-900 border-l-[8px] border-lime-500 pl-5 mb-4 uppercase tracking-tighter">
                Le Projet Sportif
              </h3>
              <p className="text-[14px] text-slate-700 leading-relaxed font-medium">
                Le Groupe Scolaire {SCHOOL.shortName} s'associe à l'ETPE pour offrir à nos élèves un parcours d'excellence unique sur le Plateau Est. Le tennis développe la maîtrise de soi, le respect et la persévérance au service de la réussite scolaire.
              </p>
            </section>
            <section className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
              <h3 className="text-base font-black text-indigo-700 mb-6 uppercase tracking-widest border-b border-indigo-100 pb-2">Planning des séances</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="bg-indigo-600 w-14 h-14 rounded-2xl shadow-md flex items-center justify-center font-black text-white text-lg">LUN</div>
                  <div>
                    <p className="text-lg font-black text-slate-900">17h00 — Tous niveaux</p>
                    <p className="text-xs text-indigo-500 uppercase font-bold tracking-widest">Entraînement hebdomadaire</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="bg-lime-500 w-14 h-14 rounded-2xl shadow-md flex items-center justify-center font-black text-slate-900 text-lg">VEN</div>
                  <div>
                    <p className="text-lg font-black text-slate-900">16h00 — Tous niveaux</p>
                    <p className="text-xs text-lime-600 uppercase font-bold tracking-widest">Entraînement hebdomadaire</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500 italic font-medium leading-relaxed">
                La fréquence (1 ou 2 fois par semaine) est définie par l&apos;encadrement technique en fonction du niveau et de la progression de l&apos;élève.
              </p>
            </section>
          </div>

          {/* RIGHT COL: Location & Info */}
          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-black text-slate-900 border-l-[8px] border-lime-500 pl-5 mb-4 uppercase tracking-tighter">
                Lieu de pratique
              </h3>
              <div className="bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-start gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -mr-16 -mt-16" />
                <span className="text-4xl mt-1">📍</span>
                <div>
                  <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-1">Le Mesnil-Esnard</p>
                  <p className="text-2xl font-black leading-tight">SIVOM</p>
                  <p className="text-sm text-indigo-100 mt-2 font-medium">Rue Pierre de Courbertin<br/>(à 2 minutes de l&apos;établissement)</p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4">
              {[
                { emoji: "🎓", title: "Équilibre scolaire", desc: "Un sport qui favorise la concentration et la gestion du stress en classe." },
                { emoji: "🌟", title: "Encadrement Pro", desc: "Cours dispensés par les moniteurs diplômés d'État de l'ETPE." },
                { emoji: "🎾", title: "Matériel fourni", desc: "Le club met à disposition le matériel nécessaire pour les débutants." }
              ].map(item => (
                <div key={item.title} className="flex gap-6 items-center bg-white p-5 rounded-3xl border-2 border-slate-50 shadow-sm hover:border-lime-200 transition-colors">
                  <span className="text-3xl bg-slate-50 w-14 h-14 flex items-center justify-center rounded-2xl shadow-inner">{item.emoji}</span>
                  <div>
                    <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-tight font-medium mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER HORIZONTAL CONTACT BLOCK ── */}
        <div className="mt-auto bg-slate-950 px-8 py-4 border-t-[8px] border-lime-500">
          <div className="flex justify-between items-center gap-12">
            <div className="flex-1">
              <h3 className="text-xs font-black text-lime-400 uppercase tracking-[0.3em] mb-5">Inscriptions & Renseignements</h3>
              <div className="flex gap-16">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mb-1">Responsable ETPE</p>
                  <p className="text-md font-black text-white">Alban : {ETPE.contact.alban}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mb-1">Contact Club</p>
                  <p className="text-md font-bold text-white mt-1">{ETPE.contact.email}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mb-1">Site Officiel</p>
                  <p className="text-md font-bold text-white mt-1">www.etpe.net</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-1 rounded-lg shrink-0 shadow-2xl">
               <Image 
                 src="/QR Code Tennis.png" 
                 alt="QR Code Inscription" 
                 width={90} 
                 height={90} 
                 className="block"
               />
            </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .no-scrollbar {
            overflow: visible !important;
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

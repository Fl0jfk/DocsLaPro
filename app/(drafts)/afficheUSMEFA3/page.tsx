"use client"

import Image from "next/image";
import { SCHOOL } from "../../lib/school";

export default function AfficheUSMEFA3Page() {
  const USMEF = {
    name: "Union Sportive Mesnil-Esnard Franqueville",
    shortName: "USMEF",
    slogan: "Le football éducatif et formateur au Mesnil-Esnard",
    location: {
      city: "Le Mesnil-Esnard",
      place: "Complexe sportif de l'USMEF",
      details: "Séances encadrées sur les terrains du club, à proximité immédiate de l'établissement.",
      
    },
    contact: {
      phone: "USMEF",
      email: "facebook.com/USMEF1993"
    },
    url: "https://www.facebook.com/USMEF1993/"
  };
  const highlights = [
    { icon: "🎓", title: "Réussite scolaire", text: "Suivi régulier pour concilier entraînements et exigence académique." },
    { icon: "⚽", title: "Encadrement USMEF", text: "Progression technique et collective avec l'encadrement du club." },
    { icon: "🤝", title: "Partenariat local", text: "Un projet sport-études de proximité, concret pour les familles." },
  ];
  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center py-10 px-4 print:p-0 print:bg-white no-scrollbar">
      <button 
        onClick={() => window.print()}
        className="mb-8 px-6 py-3 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-all print:hidden flex items-center gap-2"
      >
        <span>🖨️</span> Imprimer (4 cartes sur A3)
      </button>
      <div className="bg-white shadow-2xl w-[297mm] h-[420mm] p-4 grid grid-cols-2 grid-rows-2 gap-0 print:shadow-none print:w-full print:h-full print:border-none">
        {Array.from({ length: 4 }).map((_, i) => (
          <article key={i} className="relative overflow-hidden flex flex-col h-full">
            <div className="relative h-[62mm] bg-slate-800">
              <Image
                src="/TeamUSMEF.jpg"
                alt="Équipe USMEF"
                fill
                className="object-cover"
                style={{ objectPosition: "center center" }}
                priority={i === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/20 to-transparent" />
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <Image
                  src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png"
                  alt="Logo La Providence"
                  width={80}
                  height={80}
                  className="rounded bg-white/95 p-1.5"
                />
                <Image src="/USMEF.png" alt="Logo USMEF" width={80} height={80} className="rounded bg-white/95 p-0.5" />
              </div>
              <div className="absolute bottom-2 left-2 right-2">
                <p className="inline-block bg-lime-400 text-lime-950 text-[14px] font-black uppercase tracking-wider px-2.5 py-0.5">
                  Partenariat local
                </p>
                <h2 className="text-white font-black text-[28px] leading-[0.95] mt-1 tracking-tight">
                  SECTION FOOTBALL
                </h2>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="p-4">
              <p className="text-[15px] text-slate-700 font-semibold leading-snug">
                {SCHOOL.shortName} x {USMEF.shortName} : un parcours sport-études local pour concilier football, rigueur et réussite scolaire. Ce partenariat permet à chaque élève de progresser sportivement, de gagner en confiance et de développer des habitudes de travail solides.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[14px]">
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <p className="font-black text-indigo-700 uppercase">Lieu</p>
                  <p className="font-semibold text-slate-800">{USMEF.location.city}</p>
                  <p className="text-slate-600">{USMEF.location.place}</p>
                  <p className="text-slate-600 mt-1 leading-snug">{USMEF.location.details}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <p className="font-black text-lime-700 uppercase">Organisation</p>
                  <p className="font-semibold text-slate-800">Section Football</p>
                  <p className="text-slate-600">Entraînements encadrés par l'équipe éducative du club.</p>
                  <p className="text-slate-600">Intégration dans un projet collectif, compétitions et progression.</p>
                </div>
              </div>
              <div className="mt-3 mb-2 grid grid-cols-3 gap-2">
                {highlights.map((item) => (
                  <div key={item.title} className="border border-slate-200 bg-white p-2 rounded-lg">
                    <p className="text-[20px] leading-none">{item.icon}</p>
                    <p className="text-[15px] font-black text-slate-900 mt-1">{item.title}</p>
                    <p className="text-[14px] text-slate-600 mt-0.5 leading-snug">{item.text}</p>
                  </div>
                ))}
              </div>
              </div>
              <div className="mt-auto flex items-center justify-between w-full gap-2 bg-slate-900 text-white px-2.5 py-2">
                <div className="min-w-0">
                  <p className="text-[15px] text-lime-300 font-black uppercase tracking-wider">Inscriptions</p> 
                  <p className="text-[14px] font-bold truncate">Club : {USMEF.contact.phone}</p>
                  <p className="text-[14px] text-slate-300 truncate">{USMEF.contact.email}</p>
                </div>
                <Image src="/QRcodeUSMEF.png" alt="QR Code USMEF" width={80} height={80} className="p-0.5 rounded-lg"/>
              </div>
            </div>
            <div className="absolute right-[105px] bottom-[-95px] w-[250px] h-[250px]">
                  <Image src="/Ballon-foot.png" alt="Ballon de football" width={250} height={250} className="p-0.5 rounded-lg"/>
                </div>
          </article>
        ))}
      </div>
      <style jsx global>{`
        @media print {
          @page {
            size: A3;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
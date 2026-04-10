"use client";

import Image from "next/image";
import { SCHOOL } from "../../lib/school";

export default function PartnerTennisPage() {
  const ETPE = {
    name: "Entente Tennis du Plateau Est",
    shortName: "ETPE",
    slogan: "Le tennis s'adapte à tous",
    location: { city: "Le Mesnil-Esnard", place: "SIVOM (Rue Pierre de Coubertin)" },
    contact: {
      phone: "06 67 19 34 95",
      email: "contact@etpe.net"
    },
    url: "https://etpe.net/"
  };
  const highlights = [
    { icon: "🎓", title: "Réussite scolaire", text: "Suivi régulier et organisation compatible avec les cours." },
    { icon: "🎾", title: "Encadrement ETPE", text: "Encadrement technique adapte au niveau de l'élève." },
    { icon: "🤝", title: "Projet local", text: "Un partenariat de proximité, simple et concret pour les familles." },
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
            <div className="relative h-[56.5mm] bg-slate-800">
              <Image
                src="/Tennis.webp"
                alt="Tennis"
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
                  width={60}
                  height={60}
                  className="rounded bg-white/95 p-1.5"
                />
                <Image src="/Etpe.png" alt="Logo ETPE" width={60} height={60} className="rounded bg-white/95 p-1.5" />
              </div>
              <div className="absolute bottom-2 left-2 right-2">
                <p className="inline-block bg-lime-400 text-lime-950 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5">
                  Partenariat local
                </p>
                <h2 className="text-white font-black text-[20px] leading-[0.95] mt-1 tracking-tight">
                  SECTION TENNIS
                </h2>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="p-4">
              <p className="text-[10.5px] text-slate-700 font-semibold leading-snug">
                {SCHOOL.shortName} x {ETPE.shortName} : un parcours sport-études de proximité pour concilier tennis, rigueur et réussite scolaire. Ce partenariat local permet à chaque élève de progresser techniquement, de gagner en confiance et de développer des habitudes de travail solides, dans un cadre exigeant, bienveillant et durable.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <p className="font-black text-indigo-700 uppercase">Lieu</p>
                  <p className="font-semibold text-slate-800">{ETPE.location.city}</p>
                  <p className="text-slate-600">{ETPE.location.place}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <p className="font-black text-lime-700 uppercase">Séances</p>
                  <p className="font-semibold text-slate-800">Lun 17h / Ven 16h</p>
                  <p className="text-slate-600">Selon niveau</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {highlights.map((item) => (
                  <div key={item.title} className="border border-slate-200 bg-white p-2 rounded-lg">
                    <p className="text-[14px] leading-none">{item.icon}</p>
                    <p className="text-[9px] font-black text-slate-900 mt-1">{item.title}</p>
                    <p className="text-[8px] text-slate-600 mt-0.5 leading-snug">{item.text}</p>
                  </div>
                ))}
              </div>
              </div>
              <div className="mt-auto flex items-center justify-between w-full gap-2 bg-slate-900 text-white px-2.5 py-2">
                <div className="min-w-0">
                  <p className="text-[8px] text-lime-300 font-black uppercase tracking-wider">Inscriptions</p> 
                  <p className="text-[10px] font-bold truncate">Xavier : {ETPE.contact.phone}</p>
                  <p className="text-[9px] text-slate-300 truncate">{ETPE.contact.email}</p>
                </div>
                <Image src="/QR Code Tennis.png" alt="QR Code ETPE" width={56} height={56} className="p-0.5 rounded-lg"/>
              </div>
            </div>
            <div className="absolute right-[55px] bottom-[-95px] w-[250px] h-[250px]">
                  <Image src="/BalleTennis.png" alt="BalleTennis" width={250} height={250} className="p-0.5 rounded-lg"/>
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

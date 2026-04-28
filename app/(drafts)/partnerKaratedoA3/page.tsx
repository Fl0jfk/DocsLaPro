"use client";

import Image from "next/image";
import { SCHOOL } from "../../lib/school";

export default function PartnerKaratedoA3Page() {
  const heroBackgroundImage = "/Karate.jpg";
  const heroBackgroundPosition = "center 55%";
  const KARATE_DO = {
    name: "Karaté-do",
    shortName: "Karaté-do",
    slogan: "Discipline, respect et progression",
    location: { city: "Boos", place: "Salle n°2, rue des Canadiens, 76520 Boos" },
    contact: {
      president: "M. BERVEGLIERI André",
      email: "andre.berveglieri@wanadoo.fr"
    },
    schedule: "Vendredi à 16h00",
    audience: "Cours réservé aux débutants",
  };
  const highlights = [
    { icon: "🎓", title: "Réussite scolaire", text: "Organisation compatible avec le rythme de l'élève." },
    { icon: "🥋", title: "Karaté-do", text: "Pratique technique orientée maîtrise de soi et apprentissage." },
    { icon: "🤝", title: "Partenariat local", text: "Une offre de proximité claire et accessible pour les familles." },
  ];
  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center py-10 px-4 print:p-0 print:bg-white no-scrollbar">
      <button 
        onClick={() => window.print()}
        className="mb-8 px-6 py-3 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-all print:hidden flex items-center gap-2"
      >
        <span>🖨️</span> Imprimer (4 cartes sur A3)
      </button>
      <div className="bg-white shadow-2xl min-h-screen p-4 grid grid-cols-2 grid-rows-2 gap-0 print:shadow-none print:w-full print:h-full print:border-none">
        {Array.from({ length: 4 }).map((_, i) => (
          <article key={i} className="relative overflow-hidden flex flex-col h-full">
            <div className="relative h-[70mm] bg-slate-900">
              <Image
                src={heroBackgroundImage}
                alt="Fond Karaté-do"
                fill
                className="object-cover"
                style={{ objectPosition: heroBackgroundPosition }}
                priority={i === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <Image
                  src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png"
                  alt="Logo La Providence"
                  width={100}
                  height={100}
                  className="rounded bg-white/95 p-1.5"
                />
                <div className="w-[100px] h-[100px] rounded bg-white/95 flex items-center justify-center text-[80px]">🥋</div>
              </div>
              <div className="absolute bottom-2 left-2 right-2">
                <p className="inline-block bg-lime-400 text-lime-950 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5">
                  Partenariat local
                </p>
                <h2 className="text-white font-black text-[20px] leading-[0.95] mt-1 tracking-tight">
                  SECTION KARATE-DO
                </h2>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="p-4">
              <p className="text-[15px] text-slate-700 font-semibold leading-snug">
                {SCHOOL.shortName} x {KARATE_DO.shortName} : un parcours sport-études de proximité pour concilier pratique sportive, rigueur et réussite scolaire. Le Karaté-do met l'accent sur la maîtrise de soi, la concentration et le respect, dans un cadre structurant et bienveillant.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[14px]">
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <p className="font-black text-indigo-700 uppercase">Lieu</p>
                  <p className="font-semibold text-slate-800">{KARATE_DO.location.city}</p>
                  <p className="text-slate-600">{KARATE_DO.location.place}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <p className="font-black text-lime-700 uppercase">Cours proposé</p>
                  <p className="font-semibold text-slate-800">{KARATE_DO.schedule}</p>
                  <p className="text-slate-600">{KARATE_DO.audience}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {highlights.map((item) => (
                  <div key={item.title} className="border border-slate-200 bg-white p-2 rounded-lg">
                    <p className="text-[20px] leading-none">{item.icon}</p>
                    <p className="text-[14px] font-black text-slate-900 mt-1">{item.title}</p>
                    <p className="text-[13px] text-slate-600 mt-0.5 leading-snug">{item.text}</p>
                  </div>
                ))}
              </div>
              </div>
              <div className="mt-auto flex items-center justify-between w-full gap-2 bg-slate-900 text-white px-2.5 py-2">
                <div className="min-w-0">
                  <p className="text-[13px] text-lime-300 font-black uppercase tracking-wider">Contact</p> 
                  <p className="text-[15px] font-bold truncate">{KARATE_DO.contact.president}</p>
                  <p className="text-[15px] text-slate-300 truncate">{KARATE_DO.contact.email}</p>
                </div>
                <Image src="/QRCode Karate.png" alt="QR Code ETPE" width={80} height={80} className="p-0.5 rounded-lg"/>
              </div>
            </div>
            <div className="absolute right-[120px] bottom-[-60px] w-[200px] h-[200px]">
                  <Image src="/Karate.png" alt="BalleTennis" width={200} height={200} className="p-0.5 rounded-lg"/>
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

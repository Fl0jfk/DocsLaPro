"use client";

import Image from "next/image";
import { SCHOOL } from "../../lib/school";

export default function PartnerAvironA3Page() {
  const heroBackgroundImage = "/Aviron.webp";
  const heroBackgroundPosition = "center 40%";
  const AVIRON = {
    name: "Aviron",
    shortName: "le CN de Belbeuf - Aviron",
    slogan: "Esprit d'équipe, technique et progression",
    location: { city: "Belbeuf", place: "8 route de Paris, 76240 Belbeuf" },
    contact: {
      president: "Matthieu : 06 83 11 83 82",
      email: "aviron.cnbelbeuf@gmail.com"
    },
    schedules: [
      { time: "Lundi à 17h00", audience: "Cours réservé aux niveaux avancés" },
      { time: "Vendredi à 16h00", audience: "Cours réservé aux débutants" },
    ],
  };
  const highlights = [
    { icon: "🎓", title: "Réussite scolaire", text: "Organisation compatible avec le rythme de l'élève." },
    { icon: "🚣", title: "Aviron", text: "Pratique technique orientée coordination, endurance et maîtrise." },
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
                alt="Fond Aviron"
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
                <div className="w-[100px] h-[100px] rounded bg-white/95 flex items-center justify-center text-[80px]">
                <Image
                  src="/Logo-CNB.webp"
                  alt="Logo La Providence"
                  width={100}
                  height={100}
                  className="rounded bg-white/95 p-1.5"
                />
                </div>
              </div>
              <div className="absolute bottom-2 left-2 right-2">
                <p className="inline-block bg-lime-400 text-lime-950 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5">
                  Partenariat local
                </p>
                <h2 className="text-white font-black text-[20px] leading-[0.95] mt-1 tracking-tight">
                  SECTION AVIRON
                </h2>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="p-4">
              <p className="text-[15px] text-slate-700 font-semibold leading-snug">
                {SCHOOL.shortName} x {AVIRON.shortName} : un parcours sport-études de proximité pour concilier pratique sportive, rigueur et réussite scolaire. L'aviron met l'accent sur la cohésion, la concentration et la progression, dans un cadre structurant et bienveillant.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[14px]">
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <p className="font-black text-indigo-700 uppercase">Lieu</p>
                  <p className="font-semibold text-slate-800">{AVIRON.location.city}</p>
                  <p className="text-slate-600">{AVIRON.location.place}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <p className="font-black text-lime-700 uppercase">Cours proposés</p>
                  <div className="space-y-1">
                    {AVIRON.schedules.map((course) => (
                      <div key={course.time}>
                        <p className="font-semibold text-slate-800">{course.time}</p>
                        <p className="text-slate-600">{course.audience}</p>
                      </div>
                    ))}
                  </div>
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
                  <p className="text-[15px] font-bold truncate">{AVIRON.contact.president}</p>
                  <p className="text-[15px] text-slate-300 truncate">{AVIRON.contact.email}</p>
                </div>
                <Image src="/qr_codepreinscription.png" alt="Logo Aviron" width={80} height={80} className="p-0.5 rounded-lg"/>
              </div>
            </div>
            <div className="absolute right-[80px] bottom-[-88px] w-[400px] h-[300px]">
                  <Image src="/Aviron footer.png" alt="Logo Aviron" width={400} height={400} className="p-0.5 rounded-lg"/>
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

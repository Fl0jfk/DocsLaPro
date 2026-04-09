"use client";

import Image from "next/image";
import { useState } from "react";
import { SCHOOL } from "@/app/lib/school";

const BMFB_LOGO_SRC = "/BMFB.png";

const BMFB = {
  fullName: "Basket Mesnil Franqueville Boos",
  shortName: "BMFB",
  tagline: "Le basket formateur au service des jeunes du territoire",
  practiceHeadline: "Formation Basket & progression",
  practiceSubline: "Mesnil-Esnard · Franqueville-Saint-Pierre · Boos",
  practiceNote:
    "Les séances se déroulent sur les installations du BMFB. Le club et l'établissement coordonnent un suivi sportif et scolaire régulier pour les élèves engagés.",
  url: "https://bmfb.fr/",
  urlDisplay: "bmfb.fr",
  contact: {
    labelResponsable: "Contact Club",
    phone: "BMFB",
  },
  flyerAudience:
    "Un partenariat local pour les jeunes basketteurs : conciliez la pratique du basket en club avec une scolarité exigeante à La Providence.",
  planning: [
    {
      dayLabel: "SPORT",
      dayShort: "basket",
      time: "Section Basket",
      sub: "Entraînements encadrés par l'encadrement du BMFB.",
    },
    {
      dayLabel: "EQUIP",
      dayShort: "pack",
      time: "Licence & Vie de club",
      sub: "Compétitions, esprit d'équipe et progression technique.",
    },
  ],
};

const PROVIDENCE_OFFER = {
  localTitle: "Partenariat local : un cadre efficace",
  localBody:
    "Le partenariat La Providence x BMFB s'adresse aux jeunes du secteur. L'objectif est simple : proposer une organisation locale sérieuse pour progresser en basket sans sacrifier la réussite scolaire.",
  bullets: [
    {
      emoji: "🏆",
      title: "Exigence & Réussite Scolaire",
      desc: "Établissement reconnu pour ses excellents taux de réussite. Nous assurons un suivi rigoureux pour garantir l'obtention des diplômes (Brevet, Bac).",
    },
    {
      emoji: "⏰",
      title: "Horaires Aménagés",
      desc: "L'emploi du temps est adapté pour les joueurs du BMFB, permettant de concilier les cours, les études surveillées et les séances d'entraînement.",
    }
  ]
};

export default function AfficheBMFBPage() {
  const [logoFailed, setLogoFailed] = useState(false);
  const [qrOk, setQrOk] = useState(true);
  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center py-10 px-4 print:p-0 print:bg-white no-scrollbar">
      <button
        type="button"
        onClick={() => window.print()}
        className="mb-8 px-6 py-3 bg-orange-600 text-white font-bold rounded-full shadow-lg hover:bg-orange-700 transition-all print:hidden flex items-center gap-2"
      >
        <span aria-hidden>🖨️</span> Imprimer l'affiche (A4)
      </button>
      <div className="bg-white shadow-2xl w-[210mm] h-[297mm] overflow-hidden flex flex-col relative print:shadow-none print:w-full print:h-full border border-slate-100 print:border-none">
        <div className="px-10 py-[14px] flex justify-between items-center border-b-[6px] border-orange-500">
          <div className="flex items-center gap-6">
            <Image
              src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png"
              alt="Logo La Providence"
              width={90}
              height={90}
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
          <div className="flex flex-col items-end min-w-[120px]">
            {!logoFailed ? (
              <Image
                src={BMFB_LOGO_SRC}
                alt={`Logo ${BMFB.shortName}`}
                width={210}
                height={110}
                className="object-contain h-[6.5rem] w-auto max-w-[210px]"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="text-right py-1">
                <p className="text-3xl font-black text-orange-600 tracking-tighter leading-none">{BMFB.shortName}</p>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1.5">{BMFB.fullName}</p>
              </div>
            )}
          </div>
        </div>
        <div className="relative h-[70mm] overflow-hidden bg-slate-900 mb-2">
          <Image
            src="/BMFBhero.jpeg"
            alt="Equipe de basket BMFB"
            fill
            style={{ objectPosition: "center 5%" }}
            className="object-cover"
            priority
            quality={100}
            sizes="210mm"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/35 to-transparent" />

          <div className="absolute bottom-10 left-10 right-10">
            <span className="bg-orange-500 text-white text-[12px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-sm inline-block mb-3 shadow-lg">
              Partenariat BMFB × Scolarité
            </span>
            <h2 className="text-5xl sm:text-6xl font-black text-white leading-[0.85] tracking-tighter drop-shadow-2xl">
              SECTION <br />
              <span className="text-orange-400 italic font-black">BASKET BMFB</span>
            </h2>
            <p className="mt-2 text-[13px] font-bold text-white/95 tracking-wide max-w-xl leading-snug">
              {BMFB.tagline}
            </p>
          </div>
        </div>
        <div className="px-10 py-6 grid grid-cols-2 gap-x-10 gap-y-3 flex-1 min-h-0">
          <div className="space-y-4 min-w-0">
            <section>
              <h3 className="text-[17px] font-black text-slate-900 border-l-[8px] border-orange-500 pl-4 mb-6 uppercase tracking-tight leading-tight">
                Le Projet Sportif (BMFB)
              </h3>
              <p className="text-[15px] text-slate-700 leading-snug font-medium">
                Le <strong>{BMFB.fullName}</strong> accompagne les jeunes basketteurs dans une dynamique de progression. Ce partenariat structure un double projet sport-études dans un cadre local de proximité.
              </p>
            </section>

            <section className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-orange-700 mb-4 uppercase tracking-widest border-b border-orange-100 pb-1">
                Organisation Basket
              </h3>
              <div className="space-y-3">
                {BMFB.planning.map((slot) => (
                  <div key={slot.dayShort} className="flex items-center gap-3">
                    <div className="bg-orange-500 w-11 h-11 rounded-xl shadow-sm flex items-center justify-center font-black text-white text-[9px] leading-tight text-center px-0.5 shrink-0">
                      {slot.dayLabel}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-tight">{slot.time}</p>
                      <p className="text-[11px] text-orange-600 uppercase font-bold tracking-wide leading-tight">{slot.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-start gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
                <span className="text-2xl shrink-0" aria-hidden>📍</span>
                <div className="min-w-0">
                  <p className="text-[12px] font-black text-orange-300 uppercase tracking-widest">{BMFB.practiceSubline}</p>
                  <p className="text-base font-black leading-tight">{BMFB.practiceHeadline}</p>
                  <p className="text-[13px] text-slate-300 mt-1 leading-snug">{BMFB.practiceNote}</p>
                </div>
              </div>
            </section>
          </div>
          <div className="space-y-6 min-w-0">
            <section>
              <h3 className="text-[17px] font-black text-slate-900 border-l-[8px] border-orange-500 pl-4 mb-6 uppercase tracking-tight leading-tight">
                Scolarité & Projet Éducatif
              </h3>
              <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10" />
                <p className="text-[12px] font-black text-orange-100 uppercase tracking-widest mb-1 relative">Point clé</p>
                <h4 className="text-xl font-black leading-tight relative">{PROVIDENCE_OFFER.localTitle}</h4>
                <p className="text-[13px] text-red-50 mt-2 leading-snug font-medium relative">{PROVIDENCE_OFFER.localBody}</p>
              </div>
            </section> 
            <div className="space-y-6">
              {PROVIDENCE_OFFER.bullets.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-3 items-center bg-white p-2.5 rounded-2xl border-2 border-slate-100 shadow-sm"
                >
                  <span className="text-xl bg-slate-50 w-11 h-11 flex items-center justify-center rounded-xl shadow-inner shrink-0">
                    {item.emoji}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[12px] text-slate-600 leading-snug font-medium mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-auto bg-slate-950 px-8 py-4 border-t-[8px] border-orange-500">
          <div className="flex justify-between items-center gap-8">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-orange-300 uppercase tracking-[0.3em] mb-5">
                Inscriptions & Renseignements
              </h3>
              <div className="flex flex-wrap gap-x-12 gap-y-4">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mb-1">Site du Club</p>
                  <p className="text-sm font-bold text-white">{BMFB.urlDisplay}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mb-1">École</p>
                  <p className="text-sm font-bold text-white">{SCHOOL.phone.display}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{SCHOOL.address.city}</p>
                </div>
                <div>
                  <div className="left-[425px] w-[190px] h-[190px] bottom-[8px] absolute">
                    <Image
                      src="/BallonBB.png"
                      alt="Ballon de basket"
                      width={190}
                      height={190}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
            {qrOk ? (
              <div className="bg-white p-1 rounded-lg shrink-0 shadow-2xl">
                <Image
                  src="/QRcodeBMFB.png"
                  alt="QR code"
                  width={80}
                  height={80}
                  className="block"
                  onError={() => setQrOk(false)}
                />
              </div>
            ) : null}
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
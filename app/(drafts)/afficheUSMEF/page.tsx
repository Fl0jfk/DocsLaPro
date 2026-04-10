"use client";

import Image from "next/image";
import { useState } from "react";
import { SCHOOL } from "@/app/lib/school";

const USMEF_LOGO_SRC = "/USMEF.png";

const USMEF = {
  fullName: "Union Sportive Mesnil-Esnard Franqueville",
  shortName: "USMEF",
  tagline: "Le football éducatif et formateur au Mesnil-Esnard",
  practiceHeadline: "Formation & progression",
  practiceSubline: "Mesnil-Esnard",
  practiceNote:
    "Les séances se déroulent sur les installations de l'USMEF. Le club et l'établissement coordonnent l'accompagnement sportif et scolaire des jeunes.",
  url: "https://www.facebook.com/USMEF1993/",
  urlDisplay: "facebook.com/USMEF1993",
  contact: {
    labelResponsable: "Contact Club",
    phone: "USMEF",
  },
  flyerAudience:
    "Un partenariat local pour les jeunes passionnés : conciliez votre pratique du football avec une scolarité exigeante à La Providence.",
  planning: [
    {
      dayLabel: "SPORT",
      dayShort: "foot",
      time: "Section Football",
      sub: "Entraînements encadrés par l'équipe éducative du club.",
    },
    {
      dayLabel: "EQUIP",
      dayShort: "pack",
      time: "Licence & Vie de club",
      sub: "Intégration dans un projet collectif, compétitions et progression.",
    },
  ],
};

const PROVIDENCE_OFFER = {
  localTitle: "Partenariat local : un cadre efficace",
  localBody:
    "Le partenariat La Providence x USMEF s'adresse aux jeunes du secteur. L'objectif est simple : proposer une organisation locale sérieuse pour progresser dans le football sans sacrifier la réussite scolaire.",
  bullets: [
    {
      emoji: "🏆",
      title: "Exigence & Réussite Scolaire",
      desc: "Établissement reconnu pour ses excellents taux de réussite. Nous assurons un suivi rigoureux pour garantir l'obtention des diplômes (Brevet, Bac).",
    },
    {
      emoji: "⏰",
      title: "Horaires Aménagés",
      desc: "L'emploi du temps est adapté pour les joueurs de l'USMEF, permettant de concilier les cours, les études surveillées et les séances d'entraînement.",
    }
  ]
};

export default function AfficheUSMEFPage() {
  const [logoFailed, setLogoFailed] = useState(false);
  const [qrOk, setQrOk] = useState(true);
  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center py-10 px-4 print:p-0 print:bg-white no-scrollbar">
      <button
        type="button"
        onClick={() => window.print()}
        className="mb-8 px-6 py-3 bg-red-700 text-white font-bold rounded-full shadow-lg hover:bg-red-800 transition-all print:hidden flex items-center gap-2"
      >
        <span aria-hidden>🖨️</span> Imprimer l'affiche (A4)
      </button>
      <div className="bg-white shadow-2xl w-[210mm] h-[297mm] overflow-hidden flex flex-col relative print:shadow-none print:w-full print:h-full border border-slate-100 print:border-none">
        <div className="px-10 py-[14px] flex justify-between items-center border-b-[6px] border-red-600">
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
                src={USMEF_LOGO_SRC}
                alt={`Logo ${USMEF.shortName}`}
                width={210}
                height={110}
                className="object-contain h-[6.5rem] w-auto max-w-[210px]"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="text-right py-1">
                <p className="text-3xl font-black text-red-700 tracking-tighter leading-none">{USMEF.shortName}</p>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1.5">{USMEF.fullName}</p>
              </div>
            )}
          </div>
        </div>
        <div className="relative h-[70mm] overflow-hidden bg-slate-900 mb-2">
          <Image
            src="/TeamUSMEF.jpg"
            alt="Terrain de football"
            fill
            style={{ objectPosition: "center 45%" }}
            className="object-cover"
           
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/35 to-transparent" />

          <div className="absolute bottom-10 left-10 right-10">
            <span className="bg-red-600 text-white text-[12px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-sm inline-block mb-3 shadow-lg">
              Partenariat USMEF × Scolarité
            </span>
            <h2 className="text-5xl sm:text-6xl font-black text-white leading-[0.85] tracking-tighter drop-shadow-2xl">
              SECTION <br />
              <span className="text-red-500 italic font-black">USMEF</span>
            </h2>
            <p className="mt-2 text-[13px] font-bold text-white/95 tracking-wide max-w-xl leading-snug">
              {USMEF.tagline}
            </p>
          </div>
        </div>
        <div className="px-10 py-6 grid grid-cols-2 gap-x-10 gap-y-3 flex-1 min-h-0">
          <div className="space-y-6 min-w-0">
            <section>
              <h3 className="text-[17px] font-black text-slate-900 border-l-[8px] border-red-600 pl-4 mb-6 uppercase tracking-tight leading-tight">
                Le Projet Sportif (USMEF)
              </h3>
              <p className="text-[15px] text-slate-700 leading-snug font-medium">
                L'<strong>{USMEF.fullName}</strong> accompagne les jeunes joueurs dans une dynamique de progression sportive. Ce partenariat permet de structurer le double projet sport-études dans un cadre local.
              </p>
            </section>

            <section className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-red-800 mb-6 uppercase tracking-widest border-b border-red-100 pb-1">
                Organisation Football
              </h3>
              <div className="space-y-3">
                {USMEF.planning.map((slot) => (
                  <div key={slot.dayShort} className="flex items-center gap-3">
                    <div className="bg-red-600 w-11 h-11 rounded-xl shadow-sm flex items-center justify-center font-black text-white text-[9px] leading-tight text-center px-0.5 shrink-0">
                      {slot.dayLabel}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-tight">{slot.time}</p>
                      <p className="text-[11px] text-red-600 uppercase font-bold tracking-wide leading-tight">{slot.sub}</p>
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
                  <p className="text-[12px] font-black text-red-300 uppercase tracking-widest">{USMEF.practiceSubline}</p>
                  <p className="text-base font-black leading-tight">{USMEF.practiceHeadline}</p>
                  <p className="text-[13px] text-slate-300 mt-1 leading-snug">{USMEF.practiceNote}</p>
                </div>
              </div>
            </section>
          </div>
          <div className="space-y-6 min-w-0">
            <section>
              <h3 className="text-[17px] font-black text-slate-900 border-l-[8px] border-red-600 pl-4 mb-6 uppercase tracking-tight leading-tight">
                Scolarité & Projet Éducatif
              </h3>
              <div className="bg-gradient-to-br from-red-700 to-red-900 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10" />
                <p className="text-[12px] font-black text-red-200 uppercase tracking-widest mb-1 relative">Point clé</p>
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
        <div className="mt-auto bg-slate-950 px-8 py-4 border-t-[8px] border-red-600">
          <div className="flex justify-between items-center gap-8">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-red-400 uppercase tracking-[0.3em] mb-5">
                Inscriptions & Renseignements
              </h3>
              <div className="flex flex-wrap gap-x-12 gap-y-4">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mb-1">Site du Club</p>
                  <p className="text-sm font-bold text-white">{USMEF.urlDisplay}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mb-1">École</p>
                  <p className="text-sm font-bold text-white">{SCHOOL.phone.display}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{SCHOOL.address.city}</p>
                </div>
                <div className="left-[405px] w-[250px] h-[250px] bottom-[-50px] absolute">
                    <Image
                      src="/Ballon-foot.png"
                      alt="Ballon de basket"
                      width={250}
                      height={250}
                      className="object-contain"
                    />
                  </div>
              </div>
            </div>
            {qrOk ? (
              <div className="bg-white p-1 rounded-lg shrink-0 shadow-2xl">
                <Image
                  src="/QRcodeUSMEF.png"
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
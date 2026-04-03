"use client";

import Image from "next/image";
import { useState } from "react";
import { SCHOOL } from "@/app/lib/school";

const FCR_LOGO_SRC = "/LogoFCR.png";

const FCR = {
  fullName: "Football Club de Rouen 1899",
  shortName: "FCR",
  tagline: "L'excellence sportive au service du talent — Rouen",
  practiceHeadline: "Formation de haut niveau",
  practiceSubline: "Stades Lefrançois & Petite Bouverie",
  practiceNote:
    "Les séances se déroulent sur les installations du FCR. Le club et l'établissement coordonnent les transports et le suivi des jeunes athlètes.",
  url: "https://www.fcrouen.fr",
  urlDisplay: "www.fcrouen.fr",
  contact: {
    labelResponsable: "Responsable Formation",
    phone: "Hugo Catelin",
  },
  flyerAudience:
    "Un partenariat conçu pour les jeunes à fort potentiel : conciliez votre passion pour le football avec une scolarité exemplaire en Normandie.",
  planning: [
    {
      dayLabel: "SPORT",
      dayShort: "foot",
      time: "Section Football",
      sub: "Entraînements encadrés par les éducateurs diplômés du FCR.",
    },
    {
      dayLabel: "EQUIP",
      dayShort: "pack",
      time: "Licence & Dotation",
      sub: "Pack équipement complet inclus aux couleurs des « Diables Rouges ».",
    },
  ],
};

const PROVIDENCE_OFFER = {
  internatTitle: "Internat : Un atout majeur",
  internatBody:
    "Avec une capacité de 150 pensionnaires (collège & lycée), notre internat accueille les jeunes dont la famille réside hors du bassin rouennais. Un cadre de vie stable et structuré du lundi au vendredi.",
  bullets: [
    {
      emoji: "🏆",
      title: "Exigence & Réussite Scolaire",
      desc: "Établissement reconnu pour ses excellents taux de réussite. Nous assurons un suivi rigoureux pour garantir l'obtention des diplômes (Brevet, Bac).",
    },
    {
      emoji: "⏰",
      title: "Horaires Aménagés",
      desc: "L'emploi du temps est adapté pour les joueurs du FCR, permettant de concilier les cours, les études surveillées et les séances d'entraînement.",
    },
    {
      emoji: "🤝",
      title: "Projet Éducatif",
      desc: "Une école ancrée dans des valeurs de respect et de dépassement de soi, offrant un accompagnement personnalisé à chaque élève.",
    },
  ],
};

export default function AfficheFCRPage() {
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
        {/* HEADER */}
        <div className="px-10 py-[6px] flex justify-between items-center border-b-[6px] border-red-600">
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
                src={FCR_LOGO_SRC}
                alt={`Logo ${FCR.shortName}`}
                width={210}
                height={110}
                className="object-contain h-[6.5rem] w-auto max-w-[210px]"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="text-right py-1">
                <p className="text-3xl font-black text-red-700 tracking-tighter leading-none">{FCR.shortName}</p>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1.5">
                  {FCR.fullName}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* HERO IMAGE */}
        <div className="relative h-[70mm] overflow-hidden bg-slate-900">
          <Image
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2070&auto=format&fit=crop"
            alt="Terrain de football"
            fill
            style={{ objectPosition: "center 65%" }}
            className="object-cover"
            priority
            sizes="210mm"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/35 to-transparent" />

          <div className="absolute bottom-10 left-10 right-10">
            <span className="bg-red-600 text-white text-[12px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-sm inline-block mb-3 shadow-lg">
              Partenariat FCR × Scolarité
            </span>
            <h2 className="text-5xl sm:text-6xl font-black text-white leading-[0.85] tracking-tighter drop-shadow-2xl">
              SECTION <br />
              <span className="text-red-500 italic font-black">FOOTBALL CLUB</span>
            </h2>
            <p className="mt-2 text-[13px] font-bold text-white/95 tracking-wide max-w-xl leading-snug">
              {FCR.tagline}
            </p>
          </div>
        </div>
        <div className="px-10 py-6 grid grid-cols-2 gap-x-10 gap-y-3 flex-1 min-h-0">
          <div className="space-y-3 min-w-0">
            <section>
              <h3 className="text-[17px] font-black text-slate-900 border-l-[8px] border-red-600 pl-4 mb-3 uppercase tracking-tight leading-tight">
                Le Projet Sportif (FCR)
              </h3>
              <p className="text-[15px] text-slate-700 leading-snug font-medium">
                Le <strong>{FCR.fullName}</strong> sélectionne et accompagne les futurs talents. Ce partenariat permet au club de s'appuyer sur un établissement d'excellence pour garantir l'équilibre des joueurs.
              </p>
            </section>

            <section className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-red-800 mb-3 uppercase tracking-widest border-b border-red-100 pb-1">
                Organisation Football
              </h3>
              <div className="space-y-3">
                {FCR.planning.map((slot) => (
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
                  <p className="text-[12px] font-black text-red-300 uppercase tracking-widest">{FCR.practiceSubline}</p>
                  <p className="text-base font-black leading-tight">{FCR.practiceHeadline}</p>
                  <p className="text-[13px] text-slate-300 mt-1 leading-snug">{FCR.practiceNote}</p>
                </div>
              </div>
            </section>

            <p className="text-[12px] text-slate-600 leading-snug font-semibold bg-red-50 border border-red-100 rounded-xl px-3 py-3">
              {FCR.flyerAudience}
            </p>
          </div>
          <div className="space-y-4 min-w-0">
            <section>
              <h3 className="text-[17px] font-black text-slate-900 border-l-[8px] border-red-600 pl-4 mb-3 uppercase tracking-tight leading-tight">
                Scolarité & Cadre de Vie
              </h3>
              <div className="bg-gradient-to-br from-red-700 to-red-900 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10" />
                <p className="text-[12px] font-black text-red-200 uppercase tracking-widest mb-1 relative">Point clé</p>
                <h4 className="text-xl font-black leading-tight relative">{PROVIDENCE_OFFER.internatTitle}</h4>
                <p className="text-[13px] text-red-50 mt-2 leading-snug font-medium relative">{PROVIDENCE_OFFER.internatBody}</p>
              </div>
            </section>

            <div className="space-y-4">
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

        {/* FOOTER */}
        <div className="mt-auto bg-slate-950 px-8 py-4 border-t-[8px] border-red-600">
          <div className="flex justify-between items-center gap-8">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-red-400 uppercase tracking-[0.3em] mb-5">
                Inscriptions & Renseignements
              </h3>
              <div className="flex flex-wrap gap-x-12 gap-y-4">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                    {FCR.contact.labelResponsable}
                  </p>
                  <p className="text-sm font-black text-white">{FCR.contact.phone}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mb-1">Site du Club</p>
                  <p className="text-sm font-bold text-white">{FCR.urlDisplay}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mb-1">École / Internat</p>
                  <p className="text-sm font-bold text-white">{SCHOOL.phone.display}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{SCHOOL.address.city}</p>
                </div>
              </div>
            </div>
            {qrOk ? (
              <div className="bg-white p-1 rounded-lg shrink-0 shadow-2xl">
                <Image
                  src="/QR-FCR.png"
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
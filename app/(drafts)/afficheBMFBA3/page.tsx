"use client";

import Image from "next/image";
import { useState } from "react";
import { SCHOOL } from "@/app/lib/school";

const BMFB_LOGO_SRC = "/BMFB.png";

const PARRAIN_CLUB = {
  name: "Théo Malédon",
  photoSrc: "/db34a.jpg",
  clubLogoSrc: "/RealMadrid.png",
  bio: "Joueur formé à l'école de basket du Mesnil-Esnard, joueur international et professionnel au club du Real Madrid.",
};

const BMFB = {
  fullName: "Basket Mesnil Franqueville Boos",
  shortName: "BMFB",
  tagline: "Le club formateur au service des jeunes du territoire du Plateau Est",
  practiceHeadline: "Formation Basket & progression",
  practiceSubline: "Mesnil-Esnard · Franqueville-Saint-Pierre · Boos",
  practiceNote:
    "Les séances se déroulent sur les installations du BMFB. Le club et l'établissement coordonnent un suivi sportif et scolaire régulier pour les élèves engagés.",
  urlDisplay: "bmfb.fr",
  planning: [
    {
      dayLabel: "SPORT",
      dayShort: "basket",
      time: "Section Basket",
      sub: "Entraînements encadrés par des éducateurs sportifs diplômés, passionnés et engagés.",
    },
    {
      dayLabel: "EQUIP",
      dayShort: "pack",
      time: "Licence & Vie de club",
      sub: "Compétitions, respect des valeurs et progression technique.",
    },
  ],
};

const PROVIDENCE_OFFER = {
  localTitle: "Partenariat local : un cadre efficace",
  localBody:
    "Le partenariat entre La Providence et le BMFB est une opportunité pour les jeunes passionnés(e) de basketball, souhaitant évoluer dans un environnement stimulant, proche de chez eux et qui valorise autant la performance sportive que la réussite éducative.",
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
    },
  ],
};

function BmfbFlyerCard({
  logoFailed,
  onLogoError,
  qrOk,
  onQrError,
  parrainPhotoFailed,
  onParrainPhotoError,
  priority,
}: {
  logoFailed: boolean;
  onLogoError: () => void;
  qrOk: boolean;
  onQrError: () => void;
  parrainPhotoFailed: boolean;
  onParrainPhotoError: () => void;
  priority?: boolean;
}) {
  return (
    <article className="relative overflow-hidden flex flex-col h-full">
      <div className="px-4 py-2.5 flex justify-between items-center border-b-[4px] border-orange-500 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png"
            alt="Logo La Providence"
            width={68}
            height={68}
            className="shrink-0"
            priority={priority}
          />
          <div className="min-w-0">
            <h1 className="text-[15px] font-black text-slate-900 uppercase tracking-tighter leading-tight">
              {SCHOOL.shortName}
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Éducation · Valeurs · Sport
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0 max-w-[45%]">
          {!logoFailed ? (
            <Image
              src={BMFB_LOGO_SRC}
              alt={`Logo ${BMFB.shortName}`}
              width={150}
              height={78}
              className="object-contain h-[3.4rem] w-auto max-w-[150px]"
              onError={onLogoError}
            />
          ) : (
            <div className="text-right">
              <p className="text-2xl font-black text-orange-600 leading-none">{BMFB.shortName}</p>
              <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">{BMFB.fullName}</p>
            </div>
          )}
        </div>
      </div>

      <div className="relative h-[55mm] overflow-hidden bg-slate-900 shrink-0">
        <Image
          src="/BMFBhero.jpeg"
          alt="Équipe de basket BMFB"
          fill
          style={{ objectPosition: "center 5%" }}
          className="object-cover"
          priority={priority}
          sizes="148mm"
          quality={100}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/35 to-transparent" />
        <div className="absolute bottom-2.5 left-4 right-4">
          <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.15em] px-3 py-0.5 rounded-sm inline-block mb-1.5 shadow-md">
            Partenariat BMFB × Scolarité
          </span>
          <h2 className="text-[22px] font-black text-white leading-[0.88] tracking-tighter drop-shadow-lg">
            SECTION BASKET
            <br />
            <span className="text-orange-400 italic text-[15px]">MESNIL FRANQUEVILLE BOOS BMFB</span>
          </h2>
          <p className="mt-1 text-[10px] font-bold text-white/95 leading-snug max-w-md">{BMFB.tagline}</p>
        </div>
      </div>

      <div className="px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-1 flex-1 min-h-0 items-start">
        <div className="space-y-1.5 min-w-0">
          <section>
            <h3 className="text-[14px] font-black text-slate-900 border-l-[6px] border-orange-500 pl-2.5 mb-1 uppercase tracking-tight leading-tight">
              Le Projet Sportif (BMFB)
            </h3>
            <p className="text-[11px] text-slate-700 leading-snug font-medium">
              Le <strong>{BMFB.fullName}</strong> est un club formateur qui accompagne les jeunes basketteurs(es) dans
              une dynamique de progression. Grâce à un double projet sport-études structuré, le BMFB leur permet de
              concilier entrainements et réussite scolaire, le tout dans un cadre local de proximité.
            </p>
          </section>

          <section className="bg-slate-50 p-2 rounded-xl border-2 border-slate-100">
            <h3 className="text-[10px] font-black text-orange-700 mb-1 uppercase tracking-widest border-b border-orange-100 pb-0.5">
              Organisation Basket
            </h3>
            <div className="space-y-1">
              {BMFB.planning.map((slot) => (
                <div key={slot.dayShort} className="flex items-center gap-2">
                  <div className="bg-orange-500 w-9 h-9 rounded-lg flex items-center justify-center font-black text-white text-[7px] leading-tight text-center px-0.5 shrink-0">
                    {slot.dayLabel}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-900 leading-tight">{slot.time}</p>
                    <p className="text-[9px] text-orange-600 uppercase font-bold tracking-wide leading-tight">
                      {slot.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-slate-900 text-white p-2 rounded-lg flex items-start gap-1.5 relative overflow-hidden">
            <span className="text-sm shrink-0 leading-none mt-px" aria-hidden>
              📍
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-orange-300 uppercase tracking-widest leading-tight">
                {BMFB.practiceSubline}
              </p>
              <p className="text-[11px] font-black leading-tight">{BMFB.practiceHeadline}</p>
              <p className="text-[9px] text-slate-300 mt-0.5 leading-snug">{BMFB.practiceNote}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 min-w-0">
          <section>
            <h3 className="text-[14px] font-black text-slate-900 border-l-[6px] border-orange-500 pl-2.5 mb-1 uppercase tracking-tight leading-tight">
              Scolarité & Projet Éducatif
            </h3>
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white p-2 rounded-xl relative overflow-hidden">
              <p className="text-[9px] font-black text-orange-100 uppercase tracking-widest mb-0.5">Point clé</p>
              <h4 className="text-[13px] font-black leading-tight">{PROVIDENCE_OFFER.localTitle}</h4>
              <p className="text-[10px] text-orange-50 mt-0.5 leading-snug font-medium">{PROVIDENCE_OFFER.localBody}</p>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
            <div className="flex gap-1 items-stretch">
              <div className="shrink-0">
                {!parrainPhotoFailed ? (
                  <Image
                    src={PARRAIN_CLUB.photoSrc}
                    alt={`Portrait ${PARRAIN_CLUB.name}`}
                    width={44}
                    height={52}
                    className="w-11 h-[4.5rem] object-cover"
                    onError={onParrainPhotoError}
                    unoptimized
                  />
                ) : (
                  <div
                    className="w-11 h-[3.25rem] bg-orange-100 border-r border-orange-200 flex items-center justify-center text-base"
                    aria-hidden
                  >
                    🏀
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 p-1.5">
                <p className="text-[7px] font-black text-orange-600 uppercase tracking-[0.15em] leading-none">
                  Parrain du club
                </p>
                <h4 className="text-[10px] font-black text-slate-900 leading-tight mt-0.5 uppercase">
                  {PARRAIN_CLUB.name}
                </h4>
                <p className="text-[9px] text-slate-600 leading-snug font-medium mt-0.5">{PARRAIN_CLUB.bio}</p>
              </div>
            </div>
          </section>

          <div className="space-y-1">
            {PROVIDENCE_OFFER.bullets.map((item) => (
              <div
                key={item.title}
                className="flex gap-1.5 items-center bg-white p-1.5 rounded-xl border-2 border-slate-100 shadow-sm"
              >
                <span className="text-base bg-slate-50 w-8 h-8 flex items-center justify-center rounded-lg shrink-0">
                  {item.emoji}
                </span>
                <div className="min-w-0">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[9px] text-slate-600 leading-snug font-medium mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto bg-slate-950 px-3 py-2 border-t-[5px] border-orange-500 shrink-0 relative z-10">
        <div className="pr-[4.25rem]">
          <h3 className="text-[10px] font-black text-orange-300 uppercase tracking-[0.2em] mb-1 leading-tight">
            Inscriptions & Renseignements
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            <div>
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none">Site du Club</p>
              <p className="text-[11px] font-bold text-white leading-tight">{BMFB.urlDisplay}</p>
            </div>
            <div>
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none">Encadrants</p>
              <p className="text-[10px] font-bold text-white leading-tight">P. CHAUVET : 06 71 17 97 67</p>
              <p className="text-[10px] font-bold text-white leading-tight">K. LE GALL : 06 25 35 76 75</p>
            </div>
            <div>
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none">École</p>
              <p className="text-[11px] font-bold text-white leading-tight">{SCHOOL.phone.display}</p>
              <p className="text-[9px] text-slate-400 leading-tight">{SCHOOL.address.city}</p>
            </div>
          </div>
        </div>
        {qrOk ? (
          <div className="absolute right-1.5 top-1/2 h-[55px] w-[55px] z-30 -translate-y-1/2 bg-white rounded-lg leading-none">
            <Image
              src="/QRcodeBMFB.png"
              alt="QR code BMFB"
              width={200}
              height={200}
              className="block rounded-md"
              onError={onQrError}
            />
          </div>
        ) : null}
      </div>

      <div
        className="pointer-events-none absolute right-[5rem] bottom-[-2.75rem] z-20 h-[9rem] w-[9rem]"
        aria-hidden
      >
        <Image
          src="/BallonBB.png"
          alt=""
          width={184}
          height={184}
          className="h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
        />
      </div>
    </article>
  );
}

export default function AfficheBMFBA3Page() {
  const [logoFailed, setLogoFailed] = useState(false);
  const [qrOk, setQrOk] = useState(true);
  const [parrainPhotoFailed, setParrainPhotoFailed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center py-10 px-4 print:p-0 print:bg-white no-scrollbar">
      <button
        type="button"
        onClick={() => window.print()}
        className="mb-8 px-6 py-3 bg-orange-600 text-white font-bold rounded-full shadow-lg hover:bg-orange-700 transition-all print:hidden flex items-center gap-2"
      >
        <span aria-hidden>🖨️</span> Imprimer (4 affiches sur A3)
      </button>

      <div className="bg-white shadow-2xl w-[297mm] h-[420mm] p-2 grid grid-cols-2 grid-rows-2 gap-1.5 print:shadow-none print:w-full print:h-full print:border-none print:p-1.5 print:gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <BmfbFlyerCard
            key={i}
            logoFailed={logoFailed}
            onLogoError={() => setLogoFailed(true)}
            qrOk={qrOk}
            onQrError={() => setQrOk(false)}
            parrainPhotoFailed={parrainPhotoFailed}
            onParrainPhotoError={() => setParrainPhotoFailed(true)}
            priority={i === 0}
          />
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

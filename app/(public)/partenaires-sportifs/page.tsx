"use client";

import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header/Header";
import { SCHOOL } from "../../lib/school";

type NiveauPartenaire = "ecole" | "college" | "lycee";

type PartenaireSportif = {
  id: string;
  nom: string;
  sport: string;
  niveaux: NiveauPartenaire[];
  accroche: string;
  description: string;
  points: string[];
  logoSrc: string;
  logoClassName?: string;
  siteUrl: string;
  siteLabel: string;
  /** Libellé du bouton (défaut : « Site du club ») */
  ctaLabel?: string;
  /** Couleur d’accent (bordures, pastilles) */
  ring: string;
  badgeBg: string;
  badgeText: string;
  ctaClass: string;
  misEnAvant?: boolean;
};

const NIVEAU_LABELS: Record<NiveauPartenaire, string> = {
  ecole: "École",
  college: "Collège",
  lycee: "Lycée",
};

const PARTENAIRES: PartenaireSportif[] = [
  {
    id: "fcr",
    nom: "Football Club de Rouen 1899",
    sport: "Football",
    niveaux: ["college", "lycee"],
    accroche: "Partenariat structurant avec le club historique des Diables Rouges.",
    description:
      "Un dispositif sport-études pour concilier exigence scolaire et formation football de haut niveau. Le club et l’établissement coordonnent transports, emploi du temps et suivi des élèves-athlètes.",
    points: [
      "Entraînements de très grande qualité, encadrés par des éducateurs diplômés du FCR, sur les installations du club (stades Lefrançois, Petite Bouverie, Rouen).",
      "Suivi scolaire renforcé pour viser le Brevet et le Baccalauréat.",
      "Partenariat avec réduction sur l’internat pour les élèves du dispositif : le club peut orienter ses sportifs vers un cadre scolaire exigeant, les familles bénéficient d’un tarif préférentiel — un arrangement gagnant-gagnant.",
    ],
    logoSrc: "/LogoFCR.png",
    logoClassName: "object-contain",
    siteUrl: "https://www.fcrouen.fr",
    siteLabel: "fcrouen.fr",
    ring: "ring-red-500/20",
    badgeBg: "bg-red-50",
    badgeText: "text-red-800 border-red-100",
    ctaClass: "bg-red-600 hover:bg-red-700 text-white",
    misEnAvant: true,
  },
  {
    id: "usmef",
    nom: "Union Sportive Mesnil-Esnard Franqueville",
    sport: "Football",
    niveaux: ["college", "lycee"],
    accroche: "Le club de football de la commune — partenariat local.",
    description:
      "L’USMEF propose une pratique du football éducative et formatrice sur Mesnil-Esnard. Avec l’établissement, l’accompagnement vise à allier vie de club, compétitions et exigence scolaire.",
    points: [
      "Entraînements sur les installations de l’USMEF.",
      "Projet collectif : licence, progression et intégration au club.",
      "Coordination avec la vie scolaire pour le double projet sport-études.",
    ],
    logoSrc: "/USMEF.png",
    logoClassName: "object-contain",
    siteUrl: "https://www.facebook.com/USMEF1993/",
    siteLabel: "facebook.com/USMEF1993",
    ctaLabel: "Page Facebook",
    ring: "ring-green-600/20",
    badgeBg: "bg-green-50",
    badgeText: "text-green-900 border-green-100",
    ctaClass: "bg-green-700 hover:bg-green-800 text-white",
  },
  {
    id: "bmfb",
    nom: "Basket Mesnil Franqueville Boos",
    sport: "Basket-ball",
    niveaux: ["college", "lycee"],
    accroche: "Section basket en convention — sport de proximité sur le territoire.",
    description:
      "Convention avec le BMFB pour les jeunes basketteurs : organisation locale sérieuse, entraînements de qualité et emploi du temps adapté pour garder le cap sur la réussite scolaire.",
    points: [
      "Section sport-études basket du collège à la fin du cycle.",
      "Séances sur les installations du BMFB (Mesnil-Esnard, Franqueville, Boos).",
      "Coordination club / vie scolaire pour un double projet équilibré.",
    ],
    logoSrc: "/BMFB.png",
    logoClassName: "object-contain",
    siteUrl: "https://bmfb.fr/",
    siteLabel: "bmfb.fr",
    ring: "ring-orange-500/25",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-900 border-orange-100",
    ctaClass: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  {
    id: "etpe",
    nom: "Entente Tennis du Plateau Est",
    sport: "Tennis",
    niveaux: ["ecole", "college", "lycee"],
    accroche: "Section tennis : de la primaire au lycée, encadrement ETPE.",
    description:
      "Parcours sport-études de proximité pour progresser techniquement tout en suivant une scolarité exigeante. Encadrement adapté au niveau de chaque élève.",
    points: [
      "Ouvert à l’école, au collège et au lycée.",
      "Cours et séances en lien avec le club (installations ETPE et/ou établissement).",
      "Contact club pour modalités et inscriptions.",
    ],
    logoSrc: "/Etpe.png",
    logoClassName: "object-contain",
    siteUrl: "https://etpe.net/",
    siteLabel: "etpe.net",
    ring: "ring-emerald-500/25",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-900 border-emerald-100",
    ctaClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  {
    id: "alisa",
    nom: "Centre équestre ALISA",
    sport: "Équitation",
    niveaux: ["ecole", "college", "lycee"],
    accroche: "Partenariat équitation : nature, respect et dépassement de soi.",
    description:
      "ALISA accueille les élèves du groupe scolaire pour une pratique encadrée du cheval. Cours et parcours adaptés du plus jeune âge au lycée, en lien avec le centre équestre.",
    points: [
      "Installations et cours au centre (Franqueville-Saint-Pierre, secteur).",
      "Disciplines variées : dressage, CSO, équifun, pony-games, etc.",
      "Renseignements et inscriptions sur le site du centre.",
    ],
    logoSrc: "/alisa.png",
    logoClassName: "object-contain",
    siteUrl: "https://www.alisa-equitation.fr/",
    siteLabel: "alisa-equitation.fr",
    ring: "ring-purple-500/25",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-900 border-purple-100",
    ctaClass: "bg-purple-700 hover:bg-purple-800 text-white",
  },
  {
    id: "aviron",
    nom: "Club nautique de Belbeuf — Aviron",
    sport: "Aviron",
    niveaux: ["college", "lycee"],
    accroche: "Section aviron : esprit d’équipe, technique et endurance.",
    description:
      "Partenariat avec le CN Belbeuf pour une pratique structurante de l’aviron. Cohésion, concentration et progression technique, avec des créneaux adaptés aux niveaux.",
    points: [
      "Base à Belbeuf (8 route de Paris, 76240 Belbeuf).",
      "Créneaux encadrés (débutants et niveaux avancés selon calendrier du club).",
      "Contact direct avec le club pour modalités et inscriptions.",
    ],
    logoSrc: "/Logo-CNB.webp",
    logoClassName: "object-contain",
    siteUrl: "https://www.cnbelbeuf.fr/",
    siteLabel: "cnbelbeuf.fr",
    ring: "ring-sky-500/25",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-900 border-sky-100",
    ctaClass: "bg-sky-700 hover:bg-sky-800 text-white",
  },
  {
    id: "karate",
    nom: "Section karaté-do",
    sport: "Karaté-do",
    niveaux: ["college", "lycee"],
    accroche: "Discipline, respect et maîtrise de soi — cours à Boos.",
    description:
      "Cours de karaté-do en partenariat local : progression technique, valeurs de respect et cadre bienveillant, compatible avec le rythme scolaire.",
    points: [
      "Salle à Boos (salle n°2, rue des Canadiens, 76520 Boos).",
      "Créneau type : vendredi 16h00 (débutants — se renseigner auprès du club).",
      "Inscriptions et infos par courriel auprès du responsable.",
    ],
    logoSrc: "/Karate.png",
    logoClassName: "object-contain",
    siteUrl: "mailto:andre.berveglieri@wanadoo.fr",
    siteLabel: "andre.berveglieri@wanadoo.fr",
    ctaLabel: "Écrire au club",
    ring: "ring-slate-500/25",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800 border-slate-200",
    ctaClass: "bg-slate-800 hover:bg-slate-900 text-white",
  },
];

function NiveauBadges({ niveaux }: { niveaux: NiveauPartenaire[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {niveaux.map((n) => (
        <span
          key={n}
          className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600"
        >
          {NIVEAU_LABELS[n]}
        </span>
      ))}
    </div>
  );
}

export default function PartenairesSportifsPage() {
  return (
    <div className="bg-white min-h-screen">
      <Header />
      <section className="relative min-h-[52vh] md:min-h-[58vh] overflow-hidden bg-slate-900">
        <Image
          src="/Tennis.webp"
          alt=""
          fill
          priority
          className="object-cover opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-slate-900/85 to-slate-950" />
        <div className="relative max-w-[1200px] mx-auto px-6 pt-20 pb-16 md:pt-24 md:pb-20 flex flex-col justify-end min-h-[52vh] md:min-h-[58vh]">
          <p className="text-emerald-300/90 font-bold uppercase tracking-widest text-xs mb-3">Sport & scolarité</p>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-[0.95] max-w-3xl">
            Nos partenaires sportifs
          </h1>
          <p className="mt-5 text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed">
            Des conventions locales et régionales pour allier passion sportive et réussite à{" "}
            <span className="text-white font-bold">{SCHOOL.shortName}</span> — du cycle primaire à la Terminale.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm">
              <span aria-hidden>🏆</span> Label Génération 2024
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm">
              <span aria-hidden>🤝</span> Clubs partenaires
            </span>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-emerald-50/60">
        <div className="max-w-[1200px] mx-auto px-6 py-10 grid sm:grid-cols-3 gap-6 text-center">
          {[
            { k: "Double projet", v: "Sport + études encadrés" },
            { k: "Proximité", v: "Clubs du territoire & métropole" },
            { k: "Exigence", v: "Diplômes au centre du parcours" },
          ].map(({ k, v }) => (
            <div key={k}>
              <p className="text-2xl font-black text-emerald-700">{k}</p>
              <p className="text-xs text-slate-600 mt-1 font-medium">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 py-14 md:py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs mb-2">Découvrir les partenariats</p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900">Clubs & sections</h2>
          <p className="text-slate-600 mt-3 leading-relaxed">
            Football (FCR, USMEF), basket, tennis, équitation (ALISA), aviron et karaté-do : les niveaux concernés sont indiqués sur chaque fiche. Tennis et équitation accueillent aussi les élèves de l’école. Pour les inscriptions et les créneaux, les sites ou contacts des clubs font foi.
          </p>
        </div>

        <div className="space-y-10 md:space-y-12">
          {PARTENAIRES.map((p) => (
            <article
              key={p.id}
              className={`rounded-[2rem] border border-slate-200/80 bg-slate-50/80 overflow-hidden shadow-sm hover:shadow-xl transition-shadow ring-1 ${p.ring}`}
            >
              <div className="grid md:grid-cols-[minmax(0,220px)_1fr] lg:grid-cols-[260px_1fr] gap-0">
                <div className="relative bg-white border-b md:border-b-0 md:border-r border-slate-100 p-8 flex items-center justify-center min-h-[200px]">
                  <div className="relative w-full max-w-[200px] aspect-[4/3]">
                    <Image
                      src={p.logoSrc}
                      alt={`Logo ${p.nom}`}
                      fill
                      className={p.logoClassName ?? "object-contain"}
                      sizes="(max-width: 768px) 200px, 240px"
                    />
                  </div>
                  {p.misEnAvant ? (
                    <span className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white px-2.5 py-1 rounded-full">
                      Partenariat majeur
                    </span>
                  ) : null}
                </div>
                <div className="p-6 md:p-8 lg:p-10 flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p className={`inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${p.badgeBg} ${p.badgeText}`}>
                        {p.sport}
                      </p>
                      <h3 className="mt-3 text-2xl md:text-3xl font-black text-slate-900 leading-tight">{p.nom}</h3>
                      <p className="mt-2 text-slate-600 font-medium">{p.accroche}</p>
                    </div>
                    <div className="shrink-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Concerné</p>
                      <NiveauBadges niveaux={p.niveaux} />
                    </div>
                  </div>
                  <p className="mt-5 text-slate-600 leading-relaxed">{p.description}</p>
                  <ul className="mt-4 space-y-2">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex gap-2 text-sm text-slate-700">
                        <span className="text-emerald-600 font-black shrink-0">✓</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <a
                      href={p.siteUrl}
                      {...(p.siteUrl.startsWith("mailto:")
                        ? {}
                        : { target: "_blank", rel: "noopener noreferrer" })}
                      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black shadow-sm transition ${p.ctaClass}`}
                    >
                      {p.ctaLabel ?? "Site du club"}
                      <span aria-hidden>→</span>
                    </a>
                    <span className="text-xs text-slate-500 font-mono truncate max-w-full">{p.siteLabel}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 py-16">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Une question sur une section sportive ?</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
            Les inscriptions et le détail des créneaux relèvent en partie des clubs. La direction et la vie scolaire peuvent vous orienter selon le niveau de votre enfant.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href={SCHOOL.phone.tel} className="bg-white text-slate-900 font-black px-6 py-3 rounded-full text-sm hover:bg-emerald-50 transition">
              {SCHOOL.phone.display}
            </a>
            <Link href="/college" className="border border-white/30 text-white font-bold px-6 py-3 rounded-full text-sm hover:bg-white/10 transition">
              Le collège
            </Link>
            <Link href="/lycee" className="border border-white/30 text-white font-bold px-6 py-3 rounded-full text-sm hover:bg-white/10 transition">
              Le lycée
            </Link>
            <Link href="/ecole" className="border border-white/30 text-white font-bold px-6 py-3 rounded-full text-sm hover:bg-white/10 transition">
              L&apos;école
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-500 py-8 text-center text-xs">
        <p>
          © {new Date().getFullYear()} {SCHOOL.name} · {SCHOOL.address.city}
        </p>
        <div className="flex gap-6 justify-center mt-3 flex-wrap">
          <Link href="/ecole" className="hover:text-white transition">
            École
          </Link>
          <Link href="/college" className="hover:text-white transition">
            Collège
          </Link>
          <Link href="/lycee" className="hover:text-white transition">
            Lycée
          </Link>
          <Link href="/internat" className="hover:text-white transition">
            Internat
          </Link>
          <Link href="/projet-educatif" className="hover:text-white transition">
            Projet éducatif
          </Link>
        </div>
      </footer>
    </div>
  );
}

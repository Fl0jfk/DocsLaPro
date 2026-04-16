"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/app/components/Header/Header";
import { SCHOOL } from "../../lib/school";

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-5 flex items-center justify-between gap-4 font-bold text-slate-800 hover:text-blue-600 transition-colors"
      >
        <span>{title}</span>
        <span className={`text-xl text-slate-400 transition-transform duration-300 flex-shrink-0 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <div className="pb-6 text-slate-600 leading-relaxed space-y-3">{children}</div>}
    </div>
  );
}

export default function CollegePage() {
  return (
    <div className="bg-white min-h-screen">
      <Header />
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden bg-blue-600">
        <Image src="https://docslaproimage.s3.eu-west-3.amazonaws.com/autres/Coll%C3%A8ge.jpg" alt="Collège La Providence" fill sizes="100vw" className="object-cover mix-blend-multiply opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/50 to-blue-800/90" />
        <div className="relative h-full flex flex-col items-start justify-end max-w-[1200px] mx-auto px-6 pb-16">
          <p className="text-blue-200 font-bold uppercase tracking-widest text-sm mb-3">6ème · 5ème · 4ème · 3ème</p>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-4">Le Collège</h1>
          <p className="text-xl text-blue-100 max-w-xl leading-relaxed">
            Quatre années pour construire sa personnalité, découvrir ses talents et préparer son avenir, dans un cadre bienveillant et exigeant.
          </p>
        </div>
      </section>
      <section className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "6ème → 3ème", l: "4 années de collège" },
            { n: "Bilangue", l: "Anglais + Allemand dès la 6ème" },
            { n: "Section basket", l: "Sport-études en convention" },
            { n: "25 internes", l: "Internat dès la 6ème" },
          ].map(({ n, l }) => (
            <div key={n}>
              <p className="text-2xl font-black text-blue-600">{n}</p>
              <p className="text-xs text-slate-500 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-blue-500 font-bold uppercase tracking-widest text-xs mb-3">Notre philosophie</p>
            <h2 className="text-4xl font-black text-slate-900 mb-5">Chaque jeune est unique</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Nicolas Barré affirmait au 17ème siècle qu&apos;il était nécessaire d&apos;adapter l&apos;enseignement au <strong>«  génie propre »</strong> de chacun. Cette conviction inspire notre organisation, nos choix pédagogiques et notre accompagnement.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Notre ambition : permettre à chaque élève d&apos;acquérir <strong>confiance en soi</strong>, de se valoriser, et de devenir un adulte libre et responsable — quelle que soit sa situation de départ.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: "🏫", title: "Un lieu d'éducation", desc: "Respect mutuel, règles claires, vie collective sereine — l'adolescence se vit mieux dans un cadre bienveillant mais exigeant." },
              { icon: "📚", title: "Un lieu de travail", desc: "Chaque classe dispose de sa propre salle. Étude du soir encadrée, suivi personnalisé, CDI ouvert jusqu'à 19h." },
              { icon: "🤝", title: "Un lien fort avec les familles", desc: "Réunions, rendez-vous, outils numériques, tutorats — les parents sont partenaires à chaque étape." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-slate-50 py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-8">Enseignements & vie scolaire</h2>
          <div className="bg-white rounded-3xl p-6">
            <Accordion title="Langues vivantes & langues anciennes" defaultOpen>
              <ul className="space-y-2 text-sm">
                <li>🌍 <strong>Anglais</strong> pour tous les élèves.</li>
                <li>🇩🇪 <strong>Section bilangue</strong> : Anglais + Allemand dès la 6ème.</li>
                <li>🇪🇸 <strong>Espagnol ou Allemand</strong> en LV2 à partir de la 5ème.</li>
                <li>🇬🇧 <strong>Sections britanniques</strong> en 4ème et 3ème (approfondissement anglais).</li>
                <li>📜 <strong>Latin</strong> optionnel à partir de la 5ème · <strong>Grec</strong> en 3ème.</li>
              </ul>
            </Accordion>
            <Accordion title="Activités & vie scolaire">
              <ul className="space-y-2 text-sm">
                <li>🎭 <strong>Atelier théâtre</strong> de la 6ème à la 3ème, présentation aux familles en fin d&apos;année.</li>
                <li>🎵 <strong>Option chorale</strong> : sensibilité, culture musicale, mémoire.</li>
                <li>🎵 <strong>Concerts pédagogiques</strong> : un groupe musical en résidence chaque trimestre.</li>
                <li>♟ <strong>Club d&apos;échecs, ping-pong, journal du collège, débats</strong> sur le temps de midi.</li>
                <li>✈️ <strong>Voyages scolaires</strong> : Grande-Bretagne, Allemagne, Espagne et voyages thématiques.</li>
              </ul>
            </Accordion>
            <Accordion title="Classes EBP & Brevet d'initiation aéronautique">
              <p className="text-sm"><strong>Classes EBP</strong> (Élèves à Besoins Particuliers) : effectifs allégés pour un suivi personnalisé, redonner confiance et garantir la réussite de chacun.</p>
              <p className="text-sm mt-2"><strong>BIA</strong> (Brevet d&apos;Initiation Aéronautique) : proposé en 3ème pour les élèves passionnés par l&apos;aviation.</p>
            </Accordion>
            <Accordion title="Section basket — sport-études">
              <p className="text-sm">De la 6ème à la 3ème, une convention avec le club de basket du Mesnil-Esnard permet aux élèves passionnés de concilier études et entraînements de qualité.</p>
            </Accordion>
          </div>
        </div>
      </section>
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-slate-900 mb-8">Des équipements de qualité</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "💻", label: "Salle informatique", detail: "32 postes réseau" },
            { icon: "🏀", label: "Salle omnisports", detail: "Récemment construite" },
            { icon: "🔬", label: "Laboratoires", detail: "Bien équipés" },
            { icon: "📚", label: "CDI spacieux", detail: "Accès élargi" },
          ].map(({ icon, label, detail }) => (
            <div key={label} className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <span className="text-3xl">{icon}</span>
              <p className="font-bold text-slate-800 text-sm mt-3">{label}</p>
              <p className="text-xs text-slate-500 mt-1">{detail}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-slate-50 py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-8">Informations pratiques</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
              <h3 className="font-black text-slate-800 mb-4">🕐 Horaires</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><span className="font-bold">Arrivée :</span> 8h30 tous les matins (lun–ven)</li>
                <li><span className="font-bold">Sortie :</span> 16h30 (17h30 dès la 4ème selon options)</li>
                <li><span className="font-bold">Mercredi :</span> 8h30 – 12h30</li>
                <li><span className="font-bold">Étude du soir :</span> encadrée au-delà de 16h30</li>
              </ul>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-100">
              <h3 className="font-black text-slate-800 mb-4">📞 Contact & inscription</h3>
              <p className="text-sm text-slate-600 mb-1"><span className="font-bold">Directrice :</span> {SCHOOL.college.directrice}</p>
              <p className="text-sm text-slate-600 mb-1">{SCHOOL.address.street} – {SCHOOL.address.city}</p>
              <a href={SCHOOL.phone.tel} className="text-sm font-bold text-blue-600 block mt-2">{SCHOOL.phone.display}</a>
              <a href={SCHOOL.college.emailHref} className="text-sm text-slate-500 block">{SCHOOL.college.email}</a>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="bg-slate-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Pour les 6ème → 3ème</p>
            <h3 className="text-2xl font-black text-white">L&apos;internat du collège</h3>
            <p className="text-slate-300 text-sm mt-2 max-w-sm">25 places disponibles. Un cadre de vie encadré, du lundi au vendredi, pour progresser en toute sérénité.</p>
          </div>
          <Link href="/internat" className="flex-shrink-0 bg-white text-slate-900 font-black text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform whitespace-nowrap">
            En savoir plus →
          </Link>
        </div>
      </section>
      <section className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="bg-indigo-50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between border border-indigo-100">
          <div>
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Établissement catholique sous contrat</p>
            <h3 className="text-2xl font-black text-slate-900">Notre histoire & projet pastoral</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">Héritiers de Nicolas Barré depuis le XVII<sup>e</sup> siècle — découvrez les valeurs et la spiritualité qui animent notre communauté éducative.</p>
          </div>
          <Link href="/notre-identite" className="flex-shrink-0 bg-indigo-600 text-white font-black text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform whitespace-nowrap">
            Découvrir →
          </Link>
        </div>
      </section>
      <section className="bg-blue-600 py-20">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">Votre enfant mérite le meilleur accompagnement</h2>
          <p className="text-blue-100 mb-8 max-w-md mx-auto">Prenez rendez-vous avec la direction pour une visite de l&apos;établissement.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href={SCHOOL.preinscriptionUrl} className="bg-white text-blue-600 font-black px-8 py-4 rounded-full hover:scale-105 transition-transform text-sm">
              S&apos;inscrire
            </Link>
            <a href={SCHOOL.phone.tel} className="border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition text-sm">
              {SCHOOL.phone.display}
            </a>
            <a href={SCHOOL.reglementFinancier} target="_blank" rel="noopener noreferrer" className="border-2 border-blue-200/60 text-blue-50 font-bold px-8 py-4 rounded-full hover:bg-white/10 transition text-sm">
              📄 Tarifs
            </a>
          </div>
        </div>
      </section>
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-xs">
        <p>© {new Date().getFullYear()} {SCHOOL.name} · {SCHOOL.address.city} (76)</p>
        <div className="flex gap-6 justify-center mt-3">
          <Link href="/ecole" className="hover:text-white transition">École</Link>
          <Link href="/college" className="hover:text-white transition">Collège</Link>
          <Link href="/lycee" className="hover:text-white transition">Lycée</Link>
        </div>
      </footer>
    </div>
  );
}

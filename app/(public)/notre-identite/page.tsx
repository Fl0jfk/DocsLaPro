"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "../../components/Header/Header";
import { SCHOOL } from "../../lib/school";

/* ── Timeline data ─────────────────────────────────────────────────── */
const CHAPTERS = [
  {
    id: "origines", label: "Les origines", period: "1928 – 1946", color: "amber",
    events: [
      { year: "1928", title: "Acquisition de Neuvillette", desc: "Les sœurs acquièrent la maison de Neuvillette : un château au fond d'une grande allée, un bois abandonné, des broussailles, un pigeonnier endommagé. Ni eau, ni électricité — mais une promesse.", highlight: false },
      { year: "1935", title: "L'école paroissiale", desc: "Les sœurs sont demandées pour prendre en charge l'école paroissiale du Mesnil-Esnard. La vocation éducative de la maison commence.", highlight: false },
      { year: "1940", title: "La guerre frappe", desc: "Prise en charge des élèves des maisons de Dunkerque, Rouen et Dieppe, exposées aux bombardements. Les sœurs ouvrent leurs portes.", highlight: false },
      { year: "31 août 1941", title: "Naissance du pensionnat", desc: "Le nombre de réfugiés augmentant, une déclaration officielle est nécessaire. C'est ainsi que naît le Pensionnat de Neuvillette — l'acte de naissance officiel de notre établissement.", highlight: true },
      { year: "1946", title: "La statue de Notre-Dame", desc: "Bénédiction de la statue de Notre-Dame de la Providence, protectrice du pensionnat pendant la guerre.", highlight: false },
    ],
  },
  {
    id: "construction", label: "La construction", period: "1952 – 1974", color: "blue",
    events: [
      { year: "1952", title: "Bâtiment Saint-Charles", desc: "Construction du bâtiment Saint-Charles, destiné au primaire.", highlight: false },
      { year: "1962", title: "Bâtiment Fatima", desc: "Construction du bâtiment Fatima accueillant des classes de collège et les dortoirs.", highlight: false },
      { year: "1966", title: "De la maternelle à la terminale", desc: "L'établissement comporte désormais toutes les classes. 150 élèves et l'ouverture d'un premier laboratoire de sciences.", highlight: false },
      { year: "1968", title: "Salle Jean XXIII & administration", desc: "Construction de la salle Jean XXIII et des bureaux administratifs.", highlight: false },
      { year: "1971", title: "L'école devient mixte", desc: "Grande étape : l'école ouvre ses portes aux garçons. Une décision qui reflète l'esprit d'accueil de Nicolas Barré.", highlight: false },
      { year: "1972", title: "Bâtiment Pontanam", desc: "Construction du bâtiment Pontanam avec les ateliers de dessin et de technologie.", highlight: false },
      { year: "1974", title: "Le self et 655 élèves", desc: "Mise en place du self et de la première chaîne de restauration. L'établissement compte 655 élèves.", highlight: false },
    ],
  },
  {
    id: "expansion", label: "L'expansion", period: "1977 – 1988", color: "green",
    events: [
      { year: "1977", title: "Préfabriqué Saint-Benoît", desc: "Construction du préfabriqué Saint-Benoît au lycée pour faire face à la croissance des effectifs.", highlight: false },
      { year: "1978", title: "Maternelle Dominique Savio", desc: "Construction de la maternelle Dominique Savio. Restauration du colombier en salle de catéchèse, puis bibliothèque.", highlight: false },
      { year: "1981", title: "Section FB au lycée", desc: "Ouverture de la section FB (Biotechnologies) au lycée avec au moins 40 élèves.", highlight: false },
      { year: "1986", title: "Bureautique & Sainte-Claire", desc: "Transformation du dortoir Mossabielle en salles de bureautique. Construction des préfabriqués Sainte-Claire pour le lycée.", highlight: false },
      { year: "1988", title: "CDI & salle audiovisuelle", desc: "Construction de la salle audiovisuelle et du CDI. Agrandissement du bâtiment Nicolas Barré pour le secrétariat.", highlight: false },
    ],
  },
  {
    id: "modernisation", label: "La modernisation", period: "2003 – 2011", color: "indigo",
    events: [
      { year: "2003", title: "Grand chantier de rénovation", desc: "Rénovation du self, construction du nouveau self lycée, agrandissement Pontanam (2 salles + informatique + audiovisuel). Nouveau bâtiment administratif de l'école.", highlight: false },
      { year: "2006", title: "Internat Mère Teresa", desc: "Construction de l'internat Mère Teresa pour accueillir les filles.", highlight: false },
      { year: "2007", title: "Agrandissement du CDI", desc: "Disparition de la salle audiovisuelle et agrandissement du CDI.", highlight: false },
      { year: "2009", title: "Gymnase Don Bosco", desc: "Construction de la salle polyvalente Don Bosco — un vrai gymnase pour les élèves.", highlight: false },
      { year: "2010", title: "Extension de l'internat", desc: "Extension de l'internat Mère Teresa et construction de l'espace Jean Paul II : 3 salles + informatique lycée. Réaménagement des bureaux administratifs.", highlight: false },
      { year: "2011", title: "Restructuration du restaurant", desc: "Agrandissement du restaurant scolaire lycée, nouvelle salle pour le personnel, nouvelles chambres froides.", highlight: false },
    ],
  },
  {
    id: "renaissance", label: "La renaissance", period: "2013 – 2021", color: "pink",
    events: [
      { year: "2013", title: "Nouvel espace accueil", desc: "Création d'un nouvel espace accueil dans le bâtiment Jean XXIII, rénovation de la grande salle et des bureaux administratifs.", highlight: false },
      { year: "2014", title: "Lycée Notre-Dame", desc: "Construction du nouveau lycée Notre-Dame avec 7 classes, en lieu et place des préfabriqués définitivement détruits.", highlight: false },
      { year: "2015", title: "Agrandissement Pontanam", desc: "Agrandissement du bâtiment Pontanam : 7 nouvelles classes de collège, disparition des derniers préfabriqués.", highlight: false },
      { year: "2017", title: "Salle de sport Saint-Simon", desc: "Remise à neuf complète de la salle de sport Saint-Simon et de la salle extérieure.", highlight: false },
      { year: "2018", title: "Internat garçons & maternelle", desc: "Ouverture du nouvel internat garçons et mise en service de la maternelle entièrement rénovée.", highlight: false },
      { year: "2021", title: "Mise en service du lycée Notre-Dame", desc: "Mise en service du lycée Notre-Dame et des nouveaux laboratoires. L'établissement entre pleinement dans le XXIe siècle.", highlight: true },
    ],
  },
] as const;

type ColorKey = "amber" | "blue" | "green" | "indigo" | "pink";
const COLOR: Record<ColorKey, { bg: string; border: string; badge: string; dot: string; text: string }> = {
  amber:  { bg: "bg-amber-50",  border: "border-amber-100",  badge: "bg-amber-500",  dot: "bg-amber-400",  text: "text-amber-600"  },
  blue:   { bg: "bg-blue-50",   border: "border-blue-100",   badge: "bg-blue-500",   dot: "bg-blue-400",   text: "text-blue-600"   },
  green:  { bg: "bg-green-50",  border: "border-green-100",  badge: "bg-green-500",  dot: "bg-green-400",  text: "text-green-600"  },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-100", badge: "bg-indigo-500", dot: "bg-indigo-400", text: "text-indigo-600" },
  pink:   { bg: "bg-pink-50",   border: "border-pink-100",   badge: "bg-pink-500",   dot: "bg-pink-400",   text: "text-pink-600"   },
};

export default function NotreIdentitePage() {
  const [activeChapter, setActiveChapter] = useState<string>("origines");
  const chapter = CHAPTERS.find((c) => c.id === activeChapter) ?? CHAPTERS[0];
  const c = COLOR[chapter.color as ColorKey];
  const chapterIndex = CHAPTERS.findIndex((ch) => ch.id === activeChapter);
  const prevChapter = chapterIndex > 0 ? CHAPTERS[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < CHAPTERS.length - 1 ? CHAPTERS[chapterIndex + 1] : null;

  return (
    <div className="bg-white min-h-screen">
      <Header />

      {/* ── Hero ── */}
      <section className="relative h-[65vh] min-h-[440px] overflow-hidden bg-indigo-900">
        <Image src="/PigeonnierPagode.jpg" alt="Le pigeonnier de La Providence" fill sizes="100vw" className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-800/50 to-indigo-950/95" />
        <div className="relative h-full flex flex-col items-start justify-end max-w-[1200px] mx-auto px-6 pb-16">
          <p className="text-indigo-300 font-bold uppercase tracking-widest text-sm mb-3">
            Établissement catholique sous contrat · Depuis 1941
          </p>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-4">Notre identité</h1>
          <p className="text-xl text-indigo-200 max-w-xl leading-relaxed">
            Une histoire, des valeurs, un projet pastoral — héritiers de Nicolas Barré depuis le XVII<sup>e</sup> siècle.
          </p>
        </div>
      </section>

      {/* ── Piliers rapides ── */}
      <section className="bg-indigo-50 border-b border-indigo-100">
        <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "1621", l: "Naissance de Nicolas Barré" },
            { n: "1941", l: "Fondation du pensionnat" },
            { n: "Contrat", l: "Partenaire de l'Éducation Nationale" },
            { n: "3 étab.", l: "École · Collège · Lycée" },
          ].map(({ n, l }) => (
            <div key={n}>
              <p className="text-2xl font-black text-indigo-700">{n}</p>
              <p className="text-xs text-slate-500 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nicolas Barré ── */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-indigo-500 font-bold uppercase tracking-widest text-xs mb-3">Le fondateur</p>
            <h2 className="text-4xl font-black text-slate-900 mb-5">
              Nicolas Barré
              <span className="block text-lg font-normal text-slate-400 mt-1">Amiens, 1621 — Paris, 1686</span>
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Fils d&apos;une famille chrétienne d&apos;Amiens, Nicolas entre chez les Minimes à 19 ans, animé par la devise <em>Charitas</em>. Bouleversé par les enfants qui traînent les rues de Rouen, il décide de <strong>s&apos;attaquer à la racine des malheurs par l&apos;éducation</strong>.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Il crée les premières <strong>petites écoles populaires et gratuites</strong> pour les filles puis pour les garçons, et fonde les <strong>Sœurs de l&apos;Enfant-Jésus Providence</strong> — que le peuple appellera simplement <em>les sœurs de Providence</em>.
            </p>
            <blockquote className="border-l-4 border-indigo-300 pl-5 py-1 text-indigo-700 font-medium italic text-sm">
              « Accueillir, instruire, éduquer chacun selon son génie propre. »
              <span className="block text-xs text-slate-400 not-italic mt-1">— Nicolas Barré</span>
            </blockquote>
          </div>
          <div className="space-y-4">
            {[
              { icon: "⛪", title: "Engagement envers les plus petits", desc: "Bouleversé par la misère des enfants des rues de Rouen, Nicolas Barré crée les premières écoles gratuites pour les plus défavorisés, filles et garçons." },
              { icon: "📖", title: "Éducateur de foi", desc: "« Il ne s'agit pas de donner la science seulement, mais le principal est d'inspirer l'Amour du Seigneur et de donner une éducation vraiment chrétienne. »" },
              { icon: "🕊", title: "Confiance & douceur", desc: "« Gagner les cœurs par la douceur et la droiture. Il faut s'appliquer davantage à établir le bien qu'à détruire le mal. »" },
              { icon: "🌍", title: "Un héritage vivant", desc: "La maison de Neuvillette est acquise en 1928 par les sœurs. Le pensionnat est officiellement déclaré le 31 août 1941 — naissance de La Providence Nicolas Barré." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{title}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed italic">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          NOTRE HISTOIRE — timeline interactive
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-stone-900 py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-stone-400 font-bold uppercase tracking-widest text-xs mb-3">Le Mesnil-Esnard · 1928 — 2021</p>
          <h2 className="text-4xl font-black text-white mb-2">Notre histoire</h2>
          <p className="text-stone-400 text-sm mb-8 max-w-xl">Près d&apos;un siècle de constructions, de rénovations et de croissance au service des familles.</p>

          {/* Chapter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-10">
            {CHAPTERS.map((ch) => {
              const cc = COLOR[ch.color as ColorKey];
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(ch.id)}
                  className={`flex-shrink-0 flex flex-col items-start px-4 py-2.5 rounded-xl text-left transition-all ${
                    activeChapter === ch.id ? `${cc.bg} ${cc.border} border` : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <span className={`text-xs font-black ${activeChapter === ch.id ? cc.text : "text-stone-300"}`}>{ch.label}</span>
                  <span className="text-[10px] text-stone-500">{ch.period}</span>
                </button>
              );
            })}
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2" />
            <div className="space-y-8">
              {chapter.events.map((event, i) => {
                const isLeft = i % 2 === 0;
                const cardClass = event.highlight
                  ? `${c.bg} border-2 ${c.border}`
                  : "bg-white/5 border border-white/10";
                const yearClass = event.highlight ? c.text : "text-stone-300";
                const titleClass = event.highlight ? "text-stone-900" : "text-white";
                const descClass = event.highlight ? "text-stone-600" : "text-stone-400";

                return (
                  <div key={event.year} className="relative flex flex-col md:flex-row">
                    {/* Left slot (desktop even items) */}
                    <div className={`hidden md:flex w-1/2 ${isLeft ? "justify-end pr-10" : "justify-start pl-10 order-last"}`}>
                      {isLeft && (
                        <div className={`max-w-sm w-full rounded-2xl p-5 ${cardClass}`}>
                          <p className={`text-xl font-black mb-1 ${yearClass}`}>{event.year}</p>
                          <p className={`font-bold text-sm mb-1 ${titleClass}`}>{event.title}</p>
                          <p className={`text-xs leading-relaxed ${descClass}`}>{event.desc}</p>
                        </div>
                      )}
                    </div>

                    {/* Dot */}
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 z-10">
                      <div className={`w-4 h-4 rounded-full border-2 border-stone-900 shadow ${event.highlight ? c.badge : c.dot}`} />
                    </div>

                    {/* Right slot (desktop odd items / all mobile) */}
                    <div className={`pl-12 md:pl-0 md:w-1/2 ${!isLeft ? "md:flex md:justify-end md:pr-10" : "md:flex md:justify-start md:pl-10"}`}>
                      <div className={`max-w-sm w-full rounded-2xl p-5 ${cardClass} ${isLeft ? "md:hidden" : ""}`}>
                        <p className={`text-xl font-black mb-1 ${yearClass}`}>{event.year}</p>
                        <p className={`font-bold text-sm mb-1 ${titleClass}`}>{event.title}</p>
                        <p className={`text-xs leading-relaxed ${descClass}`}>{event.desc}</p>
                      </div>  
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chapter navigation */}
          <div className="flex items-center justify-between gap-4 mt-12">
            {prevChapter ? (
              <button
                onClick={() => { setActiveChapter(prevChapter.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 hover:bg-white/10 transition group text-left flex-1 max-w-xs"
              >
                <span className="text-stone-400 text-xl flex-shrink-0">←</span>
                <div>
                  <p className="text-xs text-stone-500 font-bold">Précédent</p>
                  <p className="font-black text-white text-sm">{prevChapter.label}</p>
                </div>
              </button>
            ) : <div className="flex-1 max-w-xs" />}

            <div className="flex gap-2 items-center">
              {CHAPTERS.map((ch) => (
                <button key={ch.id} onClick={() => setActiveChapter(ch.id)}
                  className={`w-2 h-2 rounded-full transition-all ${activeChapter === ch.id ? `${COLOR[ch.color as ColorKey].badge} scale-125` : "bg-stone-600 hover:bg-stone-400"}`}
                />
              ))}
            </div>

            {nextChapter ? (
              <button
                onClick={() => { setActiveChapter(nextChapter.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 hover:bg-white/10 transition group text-right flex-1 max-w-xs justify-end"
              >
                <div>
                  <p className="text-xs text-stone-500 font-bold">Suivant</p>
                  <p className="font-black text-white text-sm">{nextChapter.label}</p>
                </div>
                <span className="text-stone-400 text-xl flex-shrink-0">→</span>
              </button>
            ) : <div className="flex-1 max-w-xs" />}
          </div>
        </div>
      </section>

      {/* ── Projet pastoral ── */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <p className="text-indigo-500 font-bold uppercase tracking-widest text-xs mb-3">Au cœur de l&apos;établissement</p>
        <h2 className="text-4xl font-black text-slate-900 mb-4">Le projet pastoral</h2>
        <p className="text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Établissement catholique, La Providence Nicolas Barré est investie d&apos;une mission de proposition de la Bonne Nouvelle — non par obligation, mais dans le <strong>respect profond des convictions de chacun</strong>.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-yellow-50 rounded-3xl p-6 border border-yellow-100">
            <span className="bg-yellow-400 text-white font-black text-xs px-3 py-1 rounded-full">ÉCOLE</span>
            <h3 className="font-black text-slate-800 mt-4 mb-3">Première annonce</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>✝ Annonce de l&apos;Évangile en maternelle et CE1 (Avent, Carême)</li>
              <li>📚 Parcours de Catéchèse <em>Nathanaël</em> à partir du CE2</li>
              <li>🙏 3 à 4 célébrations liturgiques par an, par cycles</li>
              <li>🤝 Temps de culture religieuse pour les autres confessions</li>
              <li>❤️ Jeux de Carême : actions humanitaires concrètes</li>
            </ul>
          </div>
          <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
            <span className="bg-blue-500 text-white font-black text-xs px-3 py-1 rounded-full">COLLÈGE</span>
            <h3 className="font-black text-slate-800 mt-4 mb-3">Formation chrétienne</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>⏱ 1h/semaine de Formation Chrétienne, pour tous</li>
              <li>📅 Rythme liturgique : Avent, Carême, réflexion bimensuelle</li>
              <li>🙏 Temps de prière volontaires à la chapelle chaque semaine</li>
              <li>✈️ Visites de lieux de foi : Lisieux, Chartres, Saint-Wandrille</li>
              <li>🗣 Délégués en Pastorale dans chaque classe</li>
            </ul>
          </div>
          <div className="bg-pink-50 rounded-3xl p-6 border border-pink-100">
            <span className="bg-pink-500 text-white font-black text-xs px-3 py-1 rounded-full">LYCÉE</span>
            <h3 className="font-black text-slate-800 mt-4 mb-3">Formation Humaine & Chrétienne</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>🌱 Grandir dans sa dimension humaine et spirituelle</li>
              <li>🔍 Exercer son regard critique sur ses croyances</li>
              <li>💬 Réfléchir sur la vie affective et l&apos;engagement</li>
              <li>🤲 Rendre service, aider les autres</li>
              <li>✝ Approfondir sa foi, prier et partager</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Citation centrale ── */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <p className="text-5xl text-indigo-300 font-serif mb-4">&ldquo;</p>
          <p className="text-2xl md:text-3xl font-black text-white leading-snug mb-6">
            Comme je vous ai aimés, aimez-vous les uns les autres.
          </p>
          <p className="text-indigo-200 text-sm">Fondement du projet éducatif de La Providence Nicolas Barré</p>
          <div className="mt-8 grid md:grid-cols-3 gap-4 text-left">
            {[
              { title: "ACCUEILLIR", quote: "« sans distinction ni acception de personne. » Tout en exigeant le respect du projet éducatif." },
              { title: "INSTRUIRE", quote: "« sans s'arrêter ni aux talents, ni aux dispositions bonnes ou mauvaises de ceux qu'on enseigne. »" },
              { title: "ÉDUQUER", quote: "« sans chercher les cerises sur les pruniers, car chaque personne doit porter le fruit de son espèce. »" },
            ].map(({ title, quote }) => (
              <div key={title} className="bg-white/10 rounded-2xl p-5 border border-white/10">
                <p className="font-black text-white text-sm tracking-widest mb-2">{title}</p>
                <p className="text-indigo-200 text-xs leading-relaxed italic">{quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-slate-900 mb-4">Rejoindre La Providence</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Un établissement qui croit en chaque jeune — quelle que soit sa situation de départ.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href={SCHOOL.preinscriptionUrl} className="bg-indigo-600 text-white font-black px-8 py-4 rounded-full hover:scale-105 transition-transform text-sm">
              Pré-inscription
            </Link>
            <a href={SCHOOL.phone.tel} className="border-2 border-slate-200 text-slate-700 font-bold px-8 py-4 rounded-full hover:bg-slate-50 transition text-sm">
              {SCHOOL.phone.display}
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400 py-8 text-center text-xs">
        <p>© {new Date().getFullYear()} {SCHOOL.name} · {SCHOOL.address.city} (76)</p>
        <div className="flex gap-6 justify-center mt-3 flex-wrap">
          <Link href="/ecole" className="hover:text-white transition">École</Link>
          <Link href="/college" className="hover:text-white transition">Collège</Link>
          <Link href="/lycee" className="hover:text-white transition">Lycée</Link>
          <Link href="/internat" className="hover:text-white transition">Internat</Link>
          <Link href="/notre-identite" className="hover:text-white transition">Notre identité</Link>
        </div>
      </footer>
    </div>
  );
}

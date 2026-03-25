import Link from "next/link";
import Image from "next/image";
import Header from "../../components/Header/Header";
import { SCHOOL } from "../../lib/school";

export const metadata = {
  title: "Notre identité — La Providence Nicolas Barré",
  description:
    "L'histoire, les valeurs et le projet pastoral d'un établissement catholique sous contrat, fondé dans l'esprit de Nicolas Barré.",
};

export default function NotreIdentitePage() {
  return (
    <div className="bg-white min-h-screen">
      <Header />

      {/* ── Hero ── */}
      <section className="relative h-[65vh] min-h-[440px] overflow-hidden bg-indigo-900">
        <Image
          src="/PigeonnierPagode.jpg"
          alt="Le pigeonnier de La Providence"
          fill
          sizes="100vw"
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-800/50 to-indigo-950/95" />
        <div className="relative h-full flex flex-col items-start justify-end max-w-[1200px] mx-auto px-6 pb-16">
          <p className="text-indigo-300 font-bold uppercase tracking-widest text-sm mb-3">
            Établissement catholique sous contrat · Depuis 1941
          </p>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-4">
            Notre identité
          </h1>
          <p className="text-xl text-indigo-200 max-w-xl leading-relaxed">
            Une histoire, des valeurs, un projet pastoral — héritiers de
            Nicolas Barré depuis le XVII<sup>e</sup> siècle.
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
            <p className="text-indigo-500 font-bold uppercase tracking-widest text-xs mb-3">
              Le fondateur
            </p>
            <h2 className="text-4xl font-black text-slate-900 mb-5">
              Nicolas Barré
              <span className="block text-lg font-normal text-slate-400 mt-1">
                Amiens, 1621 — Paris, 1686
              </span>
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Fils d&apos;une famille chrétienne d&apos;Amiens, Nicolas entre
              chez les Minimes à 19 ans, animé par la devise{" "}
              <em>Charitas</em>. Bouleversé par les enfants qui traînent les
              rues de Rouen, il décide de{" "}
              <strong>s&apos;attaquer à la racine des malheurs par l&apos;éducation</strong>.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Il crée les premières <strong>petites écoles populaires et gratuites</strong>{" "}
              pour les filles puis pour les garçons, et fonde les{" "}
              <strong>Sœurs de l&apos;Enfant-Jésus Providence</strong> — que le
              peuple appellera simplement <em>les sœurs de Providence</em>.
            </p>
            <blockquote className="border-l-4 border-indigo-300 pl-5 py-1 text-indigo-700 font-medium italic text-sm">
              « Accueillir, instruire, éduquer chacun selon son génie propre. »
              <span className="block text-xs text-slate-400 not-italic mt-1">
                — Nicolas Barré
              </span>
            </blockquote>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: "⛪",
                title: "Engagement envers les plus petits",
                desc: "Bouleversé par la misère des enfants des rues de Rouen, Nicolas Barré crée les premières écoles gratuites pour les plus défavorisés, filles et garçons.",
              },
              {
                icon: "📖",
                title: "Éducatrice de foi",
                desc: "« Il ne s'agit pas de donner la science seulement, mais le principal est d'inspirer l'Amour du Seigneur et de donner une éducation vraiment chrétienne. »",
              },
              {
                icon: "🕊",
                title: "Confiance & douceur",
                desc: "« Gagner les cœurs par la douceur et la droiture. Il faut s'appliquer davantage à établir le bien qu'à détruire le mal. »",
              },
              {
                icon: "🌍",
                title: "Un héritage vivant",
                desc: "La maison de Neuvillette est acquise en 1928 par les sœurs. Le pensionnat est officiellement déclaré le 31 août 1941 — c'est la naissance de La Providence Nicolas Barré.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100"
              >
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{title}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed italic">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Notre histoire locale ── */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">
            Le Mesnil-Esnard
          </p>
          <h2 className="text-4xl font-black text-white mb-8">
            L&apos;histoire du site de Neuvillette
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                year: "1928",
                title: "Acquisition de la maison",
                desc: "Les sœurs acquièrent la maison de Neuvillette : un bois abandonné, des broussailles, un pigeonnier endommagé. Ni eau ni électricité — mais une grande allée et au fond… un château !",
              },
              {
                year: "1935",
                title: "L'école paroissiale",
                desc: "Les sœurs sont demandées pour prendre en charge l'école paroissiale du Mesnil-Esnard. La communauté éducative commence à prendre forme autour des valeurs de Nicolas Barré.",
              },
              {
                year: "1941",
                title: "Naissance du pensionnat",
                desc: "La guerre oblige à accueillir les élèves de Dunkerque, Rouen et Dieppe. Le 31 août 1941, une déclaration officielle marque la naissance du pensionnat de Neuvillette — notre établissement tel qu'on le connaît.",
              },
            ].map(({ year, title, desc }) => (
              <div
                key={year}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <p className="text-4xl font-black text-indigo-300 mb-3">
                  {year}
                </p>
                <p className="font-bold text-white text-sm mb-2">{title}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Projet pastoral ── */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <p className="text-indigo-500 font-bold uppercase tracking-widest text-xs mb-3">
          Au cœur de l&apos;établissement
        </p>
        <h2 className="text-4xl font-black text-slate-900 mb-4">
          Le projet pastoral
        </h2>
        <p className="text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Établissement catholique, La Providence Nicolas Barré est investie
          d&apos;une mission de proposition de la Bonne Nouvelle — non par
          obligation, mais dans le <strong>respect profond des convictions de chacun</strong>.
          Ce message passe d&apos;abord par les attitudes de l&apos;équipe éducative,
          le regard de confiance et d&apos;espérance porté sur chaque jeune.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* École */}
          <div className="bg-yellow-50 rounded-3xl p-6 border border-yellow-100">
            <span className="bg-yellow-400 text-white font-black text-xs px-3 py-1 rounded-full">
              ÉCOLE
            </span>
            <h3 className="font-black text-slate-800 mt-4 mb-3">
              Première annonce
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                ✝ Annonce de l&apos;Évangile en maternelle et CE1 (Avent,
                Carême)
              </li>
              <li>
                📚 Parcours de Catéchèse <em>Nathanaël</em> à partir du CE2
              </li>
              <li>
                🙏 3 à 4 célébrations liturgiques par an, par cycles
              </li>
              <li>
                🤝 Temps de culture religieuse pour les élèves d&apos;autres
                confessions
              </li>
              <li>
                ❤️ Jeux de Carême : actions humanitaires concrètes
              </li>
            </ul>
          </div>

          {/* Collège */}
          <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
            <span className="bg-blue-500 text-white font-black text-xs px-3 py-1 rounded-full">
              COLLÈGE
            </span>
            <h3 className="font-black text-slate-800 mt-4 mb-3">
              Formation chrétienne
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>⏱ 1h/semaine de Formation Chrétienne, pour tous</li>
              <li>
                📅 Rythme liturgique : Avent, Carême, réflexion bimensuelle
              </li>
              <li>
                🙏 Temps de prière volontaires à la chapelle chaque semaine
              </li>
              <li>
                ✈️ Visites de lieux de foi : Lisieux, Chartres, Saint-Wandrille
              </li>
              <li>
                🗣 Délégués en Pastorale dans chaque classe
              </li>
            </ul>
          </div>

          {/* Lycée */}
          <div className="bg-pink-50 rounded-3xl p-6 border border-pink-100">
            <span className="bg-pink-500 text-white font-black text-xs px-3 py-1 rounded-full">
              LYCÉE
            </span>
            <h3 className="font-black text-slate-800 mt-4 mb-3">
              Formation Humaine & Chrétienne
            </h3>
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
          <p className="text-indigo-200 text-sm">
            Fondement du projet éducatif de La Providence Nicolas Barré
          </p>
          <div className="mt-8 grid md:grid-cols-3 gap-4 text-left">
            {[
              {
                title: "ACCUEILLIR",
                quote:
                  "« sans distinction ni acception de personne. » Tout en exigeant le respect du projet éducatif.",
              },
              {
                title: "INSTRUIRE",
                quote:
                  "« sans s'arrêter ni aux talents, ni aux dispositions bonnes ou mauvaises de ceux qu'on enseigne. »",
              },
              {
                title: "ÉDUQUER",
                quote:
                  "« sans chercher les cerises sur les pruniers, car chaque personne doit porter le fruit de son espèce. »",
              },
            ].map(({ title, quote }) => (
              <div
                key={title}
                className="bg-white/10 rounded-2xl p-5 border border-white/10"
              >
                <p className="font-black text-white text-sm tracking-widest mb-2">
                  {title}
                </p>
                <p className="text-indigo-200 text-xs leading-relaxed italic">
                  {quote}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-slate-900 mb-4">
            Rejoindre La Providence
          </h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Un établissement qui croit en chaque jeune — quelle que soit sa
            situation de départ.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href={SCHOOL.preinscriptionUrl}
              className="bg-indigo-600 text-white font-black px-8 py-4 rounded-full hover:scale-105 transition-transform text-sm"
            >
              Pré-inscription
            </Link>
            <a
              href={SCHOOL.phone.tel}
              className="border-2 border-slate-200 text-slate-700 font-bold px-8 py-4 rounded-full hover:bg-slate-50 transition text-sm"
            >
              {SCHOOL.phone.display}
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400 py-8 text-center text-xs">
        <p>
          © {new Date().getFullYear()} {SCHOOL.name} · {SCHOOL.address.city}{" "}
          (76)
        </p>
        <div className="flex gap-6 justify-center mt-3">
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
          <Link href="/notre-identite" className="hover:text-white transition">
            Notre identité
          </Link>
        </div>
      </footer>
    </div>
  );
}

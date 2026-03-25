import Link from "next/link";
import Image from "next/image";
import Header from "../../components/Header/Header";
import { SCHOOL } from "../../lib/school";

export const metadata = {
  title: "L'Internat — La Providence Nicolas Barré",
  description: "150 pensionnaires de la 6ème à la Terminale. Un cadre de vie et de travail unique au Mesnil-Esnard.",
};

export default function InternatPage() {
  return (
    <div className="bg-white min-h-screen">
      <Header />

      {/* ── Hero ── */}
      <section className="relative h-[65vh] min-h-[440px] overflow-hidden bg-slate-800">
        <Image src="/PigeonnierPagode.jpg" alt="L'internat La Providence" fill sizes="100vw" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-700/40 to-slate-900/90" />
        <div className="relative h-full flex flex-col items-start justify-end max-w-[1200px] mx-auto px-6 pb-16">
          <p className="text-slate-300 font-bold uppercase tracking-widest text-sm mb-3">Collège · Lycée · Mixte</p>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-4">L&apos;Internat</h1>
          <p className="text-xl text-slate-200 max-w-xl leading-relaxed">
            Un lieu de vie, de travail et d&apos;amitié — de la 6ème à la Terminale, du lundi au vendredi, dans l&apos;esprit de Nicolas Barré.
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "150 places", l: "Filles & garçons" },
            { n: "6ème → Terminale", l: "Collège & Lycée" },
            { n: "Lun → Ven", l: "Retour famille le vendredi" },
            { n: "Mixte", l: "Ouvert à tous" },
          ].map(({ n, l }) => (
            <div key={n}>
              <p className="text-2xl font-black text-slate-800">{n}</p>
              <p className="text-xs text-slate-500 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Présentation générale ── */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">Un choix de vie</p>
            <h2 className="text-4xl font-black text-slate-900 mb-5">Un internat qui fait la différence</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              L&apos;internat accueille <strong>150 pensionnaires</strong>, filles et garçons, de la 6ème à la Terminale : <strong>25 places</strong> sont réservées aux collégiens et <strong>125 places</strong> aux lycéens.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              L&apos;internat est ouvert du <strong>lundi matin au vendredi soir</strong>. Le retour en famille a lieu chaque semaine le vendredi soir.
            </p>
            <p className="text-slate-600 leading-relaxed italic border-l-4 border-slate-200 pl-4">
              L&apos;internat peut être bénéfique s&apos;il est accepté par les élèves comme une aide dans leurs études et un lieu d&apos;échanges et d&apos;amitié.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🏠", title: "25 places collège", desc: "Un encadrement adapté aux collégiens, dans une atmosphère sécurisante." },
              { icon: "🎓", title: "125 places lycée", desc: "Un cadre de travail optimal pour préparer le bac et les grandes études." },
              { icon: "🤝", title: "Parrainage", desc: "Chaque nouvel interne est parrainé par un élève expérimenté pour l'accueillir." },
              { icon: "🎄", title: "Esprit de famille", desc: "Noël fêté en veillée, organisée par les Terminales selon la tradition de l'établissement." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-2xl">{icon}</span>
                <p className="font-bold text-slate-800 text-sm mt-3 mb-1">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Collège ── */}
      <section className="bg-blue-50 py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <span className="bg-blue-500 text-white font-black text-xs px-3 py-1 rounded-full">COLLÈGE</span>
            <h2 className="text-3xl font-black text-slate-900">25 places — 6ème à 3ème</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: "📅", title: "Mercredi", desc: "Les surveillantes animent des activités. Sortie possible après les cours, éventuellement jusqu'au jeudi matin sur demande des familles." },
              { icon: "📚", title: "Études encadrées", desc: "Études du soir après 16h30. Suivi personnalisé possible dans le cadre de l'accompagnement éducatif pour les élèves qui en ont besoin." },
              { icon: "👨‍🏫", title: "Étude Alpha", desc: "Le lundi et jeudi de 18h à 19h, encadrée par des étudiants de cursus sélectifs. Sans surcoût pour les familles." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
                <span className="text-2xl">{icon}</span>
                <p className="font-bold text-slate-800 mt-3 mb-2">{title}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lycée ── */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <span className="bg-pink-500 text-white font-black text-xs px-3 py-1 rounded-full">LYCÉE</span>
            <h2 className="text-3xl font-black text-slate-900">125 places — 2nde à Terminale</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Vie quotidienne</h3>
              {[
                { icon: "🏀", label: "Moments de détente", desc: "Foyer, salle de sport, terrains extérieurs — pour se dépenser et souffler après les cours." },
                { icon: "📖", label: "Études surveillées", desc: "En salle, après les cours. Cadre calme et studieux pour le travail individuel." },
                { icon: "⭐", label: "Étude Alpha (lun & jeu 18h–19h)", desc: "Pour les élèves en difficulté, encadrée par des étudiants de cursus sélectifs. Sans surcoût." },
                { icon: "🎓", label: "Terminales en autogestion", desc: "Les élèves de Terminale peuvent être autorisés à travailler en autonomie." },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{label}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Ressources disponibles</h3>
              {[
                { icon: "📚", label: "CDI accessible jusqu'à 19h", desc: "Le Centre de Documentation et d'Information reste ouvert après les cours pour les recherches et lectures." },
                { icon: "💻", label: "60 postes informatiques", desc: "Deux salles informatiques accessibles jusqu'à 19h, puis de 19h30 à 20h30." },
                { icon: "🛏", label: "Chambre individuelle", desc: "Après le repas et le temps de détente, les élèves poursuivent leur travail dans leur chambre." },
                { icon: "📅", label: "Sorties mercredi", desc: "Avec l'accord des parents, sortie mercredi après-midi ou jusqu'au jeudi matin possible." },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex gap-4 p-4 bg-pink-50 rounded-2xl border border-pink-100">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{label}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Le parrainage ── */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">La tradition de l&apos;internat</p>
            <h2 className="text-4xl font-black text-white mb-5">Le parrainage</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Un élève lycéen ayant l&apos;habitude de l&apos;internat est nommé comme <strong className="text-white">parrain</strong> d&apos;un élève plus jeune (au collège) ou d&apos;un lycéen nouvellement arrivé dans l&apos;établissement.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Ce parrainage a pour vocation de <strong className="text-white">faciliter la compréhension de la vie à l&apos;internat</strong> et d&apos;aider chaque nouveau pensionnaire à s&apos;intégrer naturellement dans la communauté.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: "Lun → Ven", l: "Présence à l'internat" },
              { n: "Vendredi soir", l: "Retour en famille" },
              { n: "Noël", l: "Veillée organisée par les Terminales" },
              { n: "Mixte", l: "Filles & garçons" },
            ].map(({ n, l }) => (
              <div key={n} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <p className="text-xl font-black text-white">{n}</p>
                <p className="text-xs text-slate-400 mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact & inscription ── */}
      <section className="py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-8">Renseignements & inscription</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <h3 className="font-black text-slate-800 mb-4">🏫 Internat Collège</h3>
              <p className="text-sm text-slate-600 mb-1"><span className="font-bold">Directrice :</span> {SCHOOL.college.directrice}</p>
              <p className="text-sm text-slate-600">{SCHOOL.address.full}</p>
              <a href={SCHOOL.phone.tel} className="text-sm font-bold text-blue-600 block mt-3">{SCHOOL.phone.display}</a>
              <a href={SCHOOL.college.emailHref} className="text-xs text-slate-500 block mt-1">{SCHOOL.college.email}</a>
            </div>
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <h3 className="font-black text-slate-800 mb-4">🎓 Internat Lycée</h3>
              <p className="text-sm text-slate-600 mb-1"><span className="font-bold">Directrice :</span> {SCHOOL.lycee.directrice}</p>
              <p className="text-sm text-slate-600">{SCHOOL.address.full}</p>
              <a href={SCHOOL.phone.tel} className="text-sm font-bold text-pink-600 block mt-3">{SCHOOL.phone.display}</a>
              <a href={SCHOOL.lycee.emailHref} className="text-xs text-slate-500 block mt-1">{SCHOOL.lycee.email}</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-slate-800 py-20">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">Intéressé par l&apos;internat ?</h2>
          <p className="text-slate-300 mb-8 max-w-md mx-auto">Contactez directement la direction du collège ou du lycée pour en savoir plus et visiter les locaux.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href={SCHOOL.phone.tel} className="bg-white text-slate-900 font-black px-8 py-4 rounded-full hover:scale-105 transition-transform text-sm">
              {SCHOOL.phone.display}
            </a>
            <Link href="/portesouvertes" className="border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition text-sm">
              Portes ouvertes
            </Link>
            <a href={SCHOOL.reglementFinancier} target="_blank" rel="noopener noreferrer" className="border-2 border-slate-500 text-slate-300 font-bold px-8 py-4 rounded-full hover:bg-white/10 transition text-sm">
              📄 Tarifs
            </a>
          </div>
        </div>
      </section>
      <footer className="bg-slate-950 text-slate-400 py-8 text-center text-xs">
        <p>© {new Date().getFullYear()} {SCHOOL.name} · {SCHOOL.address.city} (76)</p>
        <div className="flex gap-6 justify-center mt-3">
          <Link href="/ecole" className="hover:text-white transition">École</Link>
          <Link href="/college" className="hover:text-white transition">Collège</Link>
          <Link href="/lycee" className="hover:text-white transition">Lycée</Link>
          <Link href="/internat" className="hover:text-white transition">Internat</Link>
        </div>
      </footer>
    </div>
  );
}

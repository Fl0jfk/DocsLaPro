"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "../../components/Header/Header";
import { SCHOOL } from "../../lib/school";

function Accordion({ title, children, defaultOpen = false, color = "hover:text-pink-600" }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; color?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full text-left py-5 flex items-center justify-between gap-4 font-bold text-slate-800 ${color} transition-colors`}
      >
        <span>{title}</span>
        <span className={`text-xl text-slate-400 transition-transform duration-300 flex-shrink-0 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <div className="pb-6 text-slate-600 leading-relaxed space-y-3">{children}</div>}
    </div>
  );
}

const LABELS = [
  { name: "Ouverture Internationale", level: "Niveau 2", color: "bg-indigo-50 border-indigo-100 text-indigo-700", desc: "Mobilité, certification en langues, dialogue interculturel. Labellisé dès 2022, niveau 2 obtenu en 2023." },
  { name: "Génération 2024", level: "Jeux Olympiques", color: "bg-orange-50 border-orange-100 text-orange-700", desc: "Partenariats clubs sportifs, accueil de sportifs de haut niveau, promotion du sport au quotidien." },
  { name: "Éco-Lycée", level: "Argent 2023", color: "bg-green-50 border-green-100 text-green-700", desc: "Label développement durable pour notre engagement sur la gestion des déchets et le tri des bio-déchets." },
  { name: "Édusanté", level: "EPSa 2024", color: "bg-teal-50 border-teal-100 text-teal-700", desc: "École Promotrice de Santé : bien-être physique, mental et social, environnement sain pour tous." },
  { name: "Euroscol", level: "Dimension européenne", color: "bg-blue-50 border-blue-100 text-blue-700", desc: "Erasmus+, diversité linguistique, échanges scolaires européens et citoyenneté européenne active." },
];

const SPECIALITES_GENERAL = [
  { s: "HGGSP", full: "Histoire-Géographie, Géopolitique & Sciences Politiques", desc: "Comprendre le monde contemporain — enjeux politiques, relations internationales, société." },
  { s: "HLP", full: "Humanités, Littérature & Philosophie", desc: "Analyser, débattre, réfléchir sur les grandes questions qui accompagnent l'humanité." },
  { s: "LLCE Anglais", full: "Langues, Littérature & Cultures Étrangères", desc: "Culture approfondie en anglais — œuvres patrimoniales, actualité et histoire des pays anglophones." },
  { s: "Mathématiques", full: "Mathématiques", desc: "Algèbre, analyse, probabilités, algorithmique et programmation approfondis." },
  { s: "NSI", full: "Numérique & Sciences Informatiques", desc: "Histoire de l'informatique, algorithmique, programmation, projets numériques." },
  { s: "Physique-Chimie", full: "Physique-Chimie", desc: "Organisation de la matière, énergie, ondes — grands enjeux sociétaux environnementaux." },
  { s: "SI", full: "Sciences de l'Ingénieur", desc: "Conception de projets innovants : mobilité, humain augmenté, écodesign." },
  { s: "SVT", full: "Sciences de la Vie et de la Terre", desc: "Évolution du vivant, enjeux planétaires, santé publique et environnement." },
  { s: "SES", full: "Sciences Économiques & Sociales", desc: "Économie, sociologie et science politique — approche pluridisciplinaire du monde contemporain." },
];

export default function LyceePage() {
  const [activeTab, setActiveTab] = useState<"general" | "st2s">("general");

  return (
    <div className="bg-white min-h-screen">
      <SiteHeader />

      {/* ── Hero ── */}
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden bg-pink-600">
        <Image src="/Labo.webp" alt="Lycée La Providence" fill sizes="100vw" className="object-cover mix-blend-multiply opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-pink-500/50 to-pink-800/90" />
        <div className="relative h-full flex flex-col items-start justify-end max-w-[1200px] mx-auto px-6 pb-16">
          <p className="text-pink-200 font-bold uppercase tracking-widest text-sm mb-3">Seconde · Première · Terminale</p>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-4">Le Lycée</h1>
          <p className="text-xl text-pink-100 max-w-xl leading-relaxed">
            Trois années décisives pour choisir sa voie, développer ses talents et s&apos;ouvrir au monde — avec 5 labels d&apos;excellence pour le prouver.
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-pink-50 border-b border-pink-100">
        <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "2nde → Terminale", l: "Général & ST2S" },
            { n: "5 labels", l: "Excellence reconnue" },
            { n: "125 internes", l: "Internat lycéens" },
            { n: "100 %", l: "Réussite au bac (2021)" },
          ].map(({ n, l }) => (
            <div key={n}>
              <p className="text-2xl font-black text-pink-600">{n}</p>
              <p className="text-xs text-slate-500 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── La Seconde ── */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-pink-500 font-bold uppercase tracking-widest text-xs mb-3">L&apos;année charnière</p>
            <h2 className="text-4xl font-black text-slate-900 mb-5">La classe de Seconde</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              La seconde est l&apos;année qui conduit les élèves au <strong>cycle terminal</strong>. Elle est conçue pour mûrir et préciser ses goûts, consolider les acquis du collège et préparer la transition vers la 1ère.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Un <strong>accompagnement personnalisé</strong> est mis en place dès la seconde : ateliers de méthode, aide, approfondissement, et orientation pour grandir dans sa formation.
            </p>
            <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100 text-sm text-slate-600">
              <p className="font-bold text-slate-800 mb-2">En fin de Seconde, chaque élève choisit sa voie :</p>
              <ul className="space-y-1">
                <li>→ <strong>Bac Général</strong> — spécialités au choix, ouverture maximale</li>
                <li>→ <strong>Bac ST2S</strong> — Sciences de la Santé et du Social</li>
              </ul>
            </div>
          </div>
          <div className="bg-slate-50 rounded-3xl p-6">
            <p className="font-black text-slate-800 mb-4 text-sm uppercase tracking-wide">Programme de Seconde</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["Français", "4h"], ["Histoire/Géographie", "3h30"],
                ["LVA / LVB", "5h30"], ["Mathématiques", "4h"],
                ["Physique-Chimie", "3h"], ["SVT", "1h30"],
                ["EPS", "2h"], ["SES", "1h30"],
                ["SNT", "1h30"], ["Accompagnement pers.", "1h30"],
              ].map(([m, h]) => (
                <div key={m} className="flex justify-between items-center px-3 py-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-700 text-xs">{m}</span>
                  <span className="font-bold text-pink-600 text-xs">{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Fork — Choisissez votre voie ── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-pink-500 font-bold uppercase tracking-widest text-xs mb-3 text-center">1ère & Terminale</p>
          <h2 className="text-4xl font-black text-slate-900 mb-4 text-center">Choisissez votre voie</h2>
          <p className="text-slate-500 text-center mb-10 max-w-xl mx-auto">Après la Seconde, deux parcours distincts vous ouvrent leurs portes. Chacun mène à des poursuites d&apos;études différentes.</p>

          {/* Tab selector */}
          <div className="flex gap-3 justify-center mb-10">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${activeTab === "general" ? "bg-pink-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:border-pink-300"}`}
            >
              🎓 Bac Général
            </button>
            <button
              onClick={() => setActiveTab("st2s")}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${activeTab === "st2s" ? "bg-pink-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:border-pink-300"}`}
            >
              🔬 Bac ST2S
            </button>
          </div>

          {/* Bac Général */}
          {activeTab === "general" && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-start gap-4 mb-8">
                <span className="text-4xl">🎓</span>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Bac Général</h3>
                  <p className="text-slate-500 text-sm mt-1">1ère & Terminale générales — Parcoursup</p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed mb-8 max-w-3xl">
                Le cycle terminal général permet une <strong>spécialisation progressive</strong>. En 1ère, l&apos;élève choisit 3 spécialités ; il en conserve 2 en Terminale. Ces choix s&apos;effectuent en fonction des goûts et dans la perspective des études supérieures (Parcoursup).
              </p>

              <div className="bg-white rounded-3xl p-6 border border-slate-100">
                <Accordion title="Les 9 enseignements de spécialité" defaultOpen color="hover:text-pink-600">
                  <p className="text-sm text-slate-500 mb-4">3 spécialités choisies en 1ère, dont 2 conservées en Terminale.</p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SPECIALITES_GENERAL.map(({ s, full, desc }) => (
                      <div key={s} className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                        <p className="font-black text-slate-800 text-sm">{s}</p>
                        <p className="text-xs text-pink-600 font-bold mb-2">{full}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </Accordion>
                <Accordion title="Enseignements optionnels" color="hover:text-pink-600">
                  <p className="text-sm text-slate-500 mb-4">2 enseignements optionnels au plus (le Latin/Grec peut s&apos;ajouter en plus).</p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    {[
                      { o: "LCA Latin & Grec ✱", d: "Peut être choisi en complément d'autres options. Étudié pendant les 3 ans de lycée." },
                      { o: "LV3 Russe ou Italien", d: "Via NECAD (Normandie Enseignement Catholique à distance)." },
                      { o: "Arts Plastiques · Musique · Théâtre", d: "Expression artistique et ouverture culturelle." },
                      { o: "Mathématiques expertes", d: "Pour les élèves visant les classes préparatoires scientifiques." },
                      { o: "Mathématiques complémentaires", d: "Consolidation des fondamentaux pour les non-spécialistes." },
                      { o: "Droit & grands enjeux du monde", d: "Droit, relations internationales, UE, jurisprudence, droit et internet." },
                    ].map(({ o, d }) => (
                      <div key={o} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="font-bold text-slate-800">{o}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{d}</p>
                      </div>
                    ))}
                  </div>
                </Accordion>
                <Accordion title="Section européenne & ouverture internationale" color="hover:text-pink-600">
                  <ul className="space-y-2 text-sm">
                    <li>🇬🇧 <strong>Section européenne anglais</strong> — DNL Histoire-Géographie · Préparation au First Certificate en Terminale</li>
                    <li>🇺🇸 <strong>Échange Boston</strong> pour les élèves de la section européenne</li>
                    <li>🇩🇪 <strong>Échange Gymnasium Harksheide</strong> (Norderstedt, Hambourg) pour les germanistes de 2nde</li>
                    <li>🇪🇸 <strong>Voyage en Espagne</strong> pour les hispanistes</li>
                    <li>🇷🇺 <strong>Échange Saint-Pétersbourg</strong> tous les 2 ans pour les LV3 Russe</li>
                  </ul>
                </Accordion>
                <Accordion title="Débouchés & poursuite d'études" color="hover:text-pink-600">
                  <p className="text-sm">L&apos;année de Terminale est rythmée par <strong>Parcoursup</strong> : les élèves découvrent les formations, formulent leurs vœux et reçoivent leurs affectations. Le lycée propose également des sessions de préparation aux concours ACCES/SESAME, prépas scientifiques, médecine, écoles de commerce.</p>
                </Accordion>
              </div>
            </div>
          )}

          {/* Bac ST2S */}
          {activeTab === "st2s" && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-start gap-4 mb-8">
                <span className="text-4xl">🔬</span>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Bac ST2S</h3>
                  <p className="text-slate-500 text-sm mt-1">Sciences et Technologies de la Santé et du Social</p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed mb-8 max-w-3xl">
                Le bac ST2S permet aux lycéens de se concentrer sur les secteurs <strong>médical, sanitaire et social</strong>. Idéal pour ceux qui souhaitent exercer des professions de santé, d&apos;éducation spécialisée ou de travail social.
              </p>

              <div className="bg-white rounded-3xl p-6 border border-slate-100">
                <Accordion title="Spécialités en 1ère" defaultOpen color="hover:text-teal-600">
                  <div className="grid md:grid-cols-3 gap-3">
                    {[
                      { s: "Physique-Chimie pour la santé", d: "Applications médicales et biologiques de la physique-chimie." },
                      { s: "Biologie & Physiopathologie humaines", d: "Fonctionnement du corps humain et mécanismes des maladies." },
                      { s: "Sciences & Techniques sanitaires et sociales", d: "Secteurs sanitaire et social, politiques de santé publique." },
                    ].map(({ s, d }) => (
                      <div key={s} className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                        <p className="font-black text-slate-800 text-sm">{s}</p>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{d}</p>
                      </div>
                    ))}
                  </div>
                </Accordion>
                <Accordion title="Spécialités en Terminale" color="hover:text-teal-600">
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { s: "Chimie, Biologie & Physiopathologie humaines", d: "Approfondissement des mécanismes biologiques et chimiques liés à la santé." },
                      { s: "Sciences & Techniques sanitaires et Sociales", d: "Politiques sociales, organisation du système de santé, accompagnement des populations." },
                    ].map(({ s, d }) => (
                      <div key={s} className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                        <p className="font-black text-slate-800 text-sm">{s}</p>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{d}</p>
                      </div>
                    ))}
                  </div>
                </Accordion>
                <Accordion title="Options disponibles" color="hover:text-teal-600">
                  <ul className="space-y-2 text-sm">
                    <li>🌍 <strong>LV3 Russe ou Italien</strong> (via NECAD)</li>
                    <li>🎨 <strong>Arts Plastiques · Musique · Théâtre</strong></li>
                  </ul>
                </Accordion>
                <Accordion title="Débouchés après le bac ST2S" color="hover:text-teal-600">
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="font-bold text-slate-800 mb-2">Formations paramédicales</p>
                      <ul className="text-slate-500 space-y-1 text-xs">
                        <li>• Infirmier(e), éducateur spécialisé</li>
                        <li>• Éducateur de jeunes enfants</li>
                        <li>• Assistant de service social</li>
                        <li>• Ergothérapeute</li>
                      </ul>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="font-bold text-slate-800 mb-2">BTS & Université</p>
                      <ul className="text-slate-500 space-y-1 text-xs">
                        <li>• BTS : SP3S, ESF, diététique, imagerie médicale</li>
                        <li>• Université : sociologie, psychologie, droit</li>
                        <li>• DUT carrières sociales</li>
                      </ul>
                    </div>
                  </div>
                </Accordion>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Les + du lycée ── */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <p className="text-pink-500 font-bold uppercase tracking-widest text-xs mb-3">Ce qui nous distingue</p>
        <h2 className="text-4xl font-black text-slate-900 mb-10">Les + du lycée</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "🌍", title: "Pôle international", items: ["Section européenne anglais (DNL)", "Échanges : Boston, Hambourg, Espagne, Saint-Pétersbourg", "Préparation au First Certificate", "Label Ouverture Internationale niveau 2"] },
            { icon: "🎭", title: "Pôle culturel", items: ["Théâtre, musique, arts plastiques", "Culture « élitaire pour tous » (A. Vitez)", "Programme annuel exigeant et spécifique", "Sorties culturelles régulières"] },
            { icon: "🏆", title: "Sport & préparation", items: ["PHI — Performance Hard Institute (partenariat Rouen Hard)", "Entraînements lun.–jeu. sur site", "PSC1, BAFA, BIA, permis de conduire", "Préparation concours ACCES/SESAME, prépas, médecine…"] },
          ].map(({ icon, title, items }) => (
            <div key={title} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <span className="text-3xl">{icon}</span>
              <h3 className="font-black text-slate-800 mt-4 mb-3">{title}</h3>
              <ul className="space-y-1.5">
                {items.map(item => (
                  <li key={item} className="text-xs text-slate-600 flex gap-2">
                    <span className="text-pink-400 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Labels ── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-pink-500 font-bold uppercase tracking-widest text-xs mb-3">Reconnaissance nationale</p>
          <h2 className="text-4xl font-black text-slate-900 mb-10">5 labels d&apos;excellence</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LABELS.map((label) => (
              <div key={label.name} className={`rounded-2xl p-5 border ${label.color}`}>
                <p className="font-black text-sm">{label.name}</p>
                <p className="text-xs font-bold opacity-70 mb-2">{label.level}</p>
                <p className="text-xs leading-relaxed opacity-80">{label.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Internat ── */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative h-64 rounded-3xl overflow-hidden bg-pink-100">
            <Image src="/PigeonnierPagode.jpg" alt="Le colombier - bibliothèque" fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div>
            <p className="text-pink-500 font-bold uppercase tracking-widest text-xs mb-3">Pour aller plus loin</p>
            <h2 className="text-4xl font-black text-slate-900 mb-5">L&apos;internat</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>125 places lycéens</strong> dans un cadre propice au travail et à la vie collective. Ouvert du lundi matin au vendredi soir.
            </p>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>✓ Études surveillées chaque soir</li>
              <li>✓ Étude Alpha encadrée par des étudiants de cursus sélectifs (lun. & jeu. · sans surcoût)</li>
              <li>✓ CDI et salles informatiques accessibles jusqu&apos;à 19h</li>
              <li>✓ Système de parrainage entre lycéens</li>
              <li>✓ Sorties le mercredi avec accord parental</li>
            </ul>
            <Link href="/internat" className="inline-flex items-center gap-2 mt-6 bg-slate-900 text-white font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform">
              Découvrir la vie à l&apos;internat →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Infos pratiques ── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-8">Informations pratiques</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-pink-50 rounded-3xl p-6 border border-pink-100">
              <h3 className="font-black text-slate-800 mb-4">🕐 Horaires</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><span className="font-bold">Cours :</span> Lundi (8h30 au plus tôt) au vendredi (17h30 au plus tard)</li>
                <li><span className="font-bold">Mercredi :</span> Pas de sortie à 11h30</li>
                <li><span className="font-bold">1ère & Terminale :</span> Cours ou DS possibles mercredi après-midi</li>
              </ul>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-100">
              <h3 className="font-black text-slate-800 mb-4">📞 Contact & inscription</h3>
              <p className="text-sm text-slate-600 mb-1"><span className="font-bold">Directrice :</span> {SCHOOL.lycee.directrice}</p>
              <p className="text-sm text-slate-600 mb-1">{SCHOOL.address.street} BP 28 – {SCHOOL.address.zip} {SCHOOL.address.city}</p>
              <a href={SCHOOL.phone.tel} className="text-sm font-bold text-pink-600 block mt-2">{SCHOOL.phone.display}</a>
              <a href={SCHOOL.lycee.emailHref} className="text-sm text-slate-500 block">{SCHOOL.lycee.email}</a>
              <p className="text-xs text-slate-400 mt-3">Inscriptions toute l&apos;année sur rendez-vous.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-r from-pink-600 to-pink-500 py-20">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">Votre bac, votre avenir — commençons ensemble</h2>
          <p className="text-pink-100 mb-8 max-w-md mx-auto">Venez découvrir notre lycée lors de nos portes ouvertes ou prenez directement rendez-vous.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/portesouvertes" className="bg-white text-pink-600 font-black px-8 py-4 rounded-full hover:scale-105 transition-transform text-sm">
              S&apos;inscrire aux portes ouvertes
            </Link>
            <a href={SCHOOL.phone.tel} className="border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition text-sm">
              {SCHOOL.phone.display}
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
          <Link href="/portesouvertes" className="hover:text-white transition">Inscription</Link>
        </div>
      </footer>
    </div>
  );
}

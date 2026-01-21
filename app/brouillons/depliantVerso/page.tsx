"use client"

export default function DepliantProvidenceVerso() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-[#cfcfd8] p-10 font-sans">
      <section id="mon-flyer-a-imprimer" className="relative w-[297mm] h-[210mm] bg-white overflow-hidden shadow-2xl flex text-white">
        {/* --- VOLET GAUCHE : ÉCOLE (ÉVEIL, CADRE & DYNAMISME) --- */}
        <div className="w-[99mm] h-full relative p-10 bg-[#fbb800] flex flex-col">
          <h3 className="text-5xl font-black italic uppercase leading-none mb-8">École</h3>
          
          <div className="flex-grow space-y-6">
            {/* 1. PÉDAGOGIE */}
            <section className="bg-white/20 p-5 rounded-2xl border border-white/40 shadow-inner">
              <h4 className="font-bold text-lg mb-2 uppercase tracking-tighter">🌱 Éveil & Autonomie</h4>
              <p className="text-[11px] leading-relaxed">
                Lieu de vie à taille humaine, notre école favorise l&apos;autonomie. 
                <strong> L&apos;initiation à l&apos;anglais dès la maternelle </strong> et la pédagogie de projet stimulent la curiosité naturelle de chaque enfant.
              </p>
            </section>

            {/* 2. DYNAMISME & SORTIES (Nouveau bloc pour remplir l'espace) */}
            <section className="bg-[#d9a600] p-5 rounded-2xl border border-white/20">
              <h4 className="font-bold text-sm mb-3 uppercase flex items-center gap-2">
                <span>🎨</span> Une École en Mouvement
              </h4>
              <ul className="text-[10px] space-y-2 font-medium">
                <li className="flex items-start gap-2">
                  • <strong>Sorties Culturelles : </strong>Opéra de Rouen, Bibliothèque, Musée des Beaux-Arts.
                </li>
                <li className="flex items-start gap-2">
                  • <strong>Ouverture au Monde : </strong>Journées à thème sur les pays et cultures étrangères.
                </li>
                <li className="flex items-start gap-2">
                  • <strong>Esprit d&apos;Équipe : </strong>Participation aux Olympiades sportives avec les écoles du plateau.
                </li>
              </ul>
            </section>

            {/* 3. HORAIRES */}
            <section className="bg-white text-gray-800 p-6 rounded-2xl shadow-xl">
              <h4 className="font-bold text-sm mb-4 uppercase text-[#fbb800] flex items-center gap-2">
                <span>🕒</span> Horaires & Sérénité
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                  <span className="text-[11px] font-bold">Accueil Matin</span>
                  <span className="text-[11px] font-black">07h30 — 08h15</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                  <span className="text-[11px] font-bold text-[#fbb800]">Classe</span>
                  <span className="text-[11px] font-black">08h30 — 16h30</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold">Étude & Garderie</span>
                  <span className="text-[11px] font-black">17h00 — 18h30</span>
                </div>
              </div>
            </section>
          </div>
  {/* SOLIDARITÉ (Pousse le contenu vers le bas) */}
        <div className="mt-6 pt-6 border-t border-white/30">
          <p className="text-[11px] font-medium leading-tight">
            <strong>L&apos;accueil de tous :</strong> Solidarité familiale via une grille tarifaire différenciée (5 catégories de revenus).
          </p>
        </div>
      </div>

        {/* --- VOLET CENTRAL : COLLÈGE (L'ACCOMAGNEMENT) --- */}
        <div className="w-[99mm] h-full relative p-10 bg-[#18aae2] flex flex-col border-x border-white/10">
          <h3 className="text-5xl font-black italic uppercase leading-none mb-8">Collège</h3>
          <div className="flex-grow space-y-4">
            <section className="bg-[#0f6a8e] p-6 rounded-2xl border border-white/30">
              <div className="flex -space-x-2">
                {/* Drapeau Anglais (Simulé) */}
                <div className="w-7 h-7 rounded-full border-2 border-white overflow-hidden relative bg-[#012169]">
                {/* Croix de Saint-André (les diagonales blanches) */}
                <div className="absolute top-1/2 left-1/2 w-[140%] h-1 bg-white -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
                <div className="absolute top-1/2 left-1/2 w-[140%] h-1 bg-white -translate-x-1/2 -translate-y-1/2 -rotate-45"></div>
                {/* Croix de Saint-Georges (la croix droite blanche) */}
                <div className="absolute top-0 left-[40%] w-[20%] h-full bg-white"></div>
                <div className="absolute top-[40%] left-0 w-full h-[20%] bg-white"></div>
                {/* Croix de Saint-Georges (le coeur rouge) */}
                <div className="absolute top-0 left-[44%] w-[12%] h-full bg-[#C8102E]"></div>
                <div className="absolute top-[44%] left-0 w-full h-[12%] bg-[#C8102E]"></div>
              </div>
                {/* Drapeau Allemand (Simulé) */}
                <div className="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-black flex flex-col">
                  <div className="h-1/3 bg-black"></div>
                  <div className="h-1/3 bg-red-600"></div>
                  <div className="h-1/3 bg-yellow-400"></div>
                </div>
                <h4 className="font-bold text-lg mb-2 pl-3 text-[#fbb800] uppercase">Option Bilingue</h4>
              </div>
              
              <p className="text-[12px] leading-relaxed">
                Dès la classe de 6ème, nous proposons un parcours bilingue unique : l&apos;Anglais et l&apos;Allemand sont enseignés avec le même niveau d&apos;exigence (double LV1).
              </p>
            </section>

            <section className="bg-white text-gray-800 p-6 rounded-2xl shadow-xl">
              <h4 className="font-bold text-sm mb-3 uppercase text-[#18aae2]">🤝 Réussir Ensemble</h4>
              <p className="text-[11px] leading-relaxed mb-4">
                Pour les élèves à besoins particuliers ou en difficulté, nous mettons en place des <strong>groupes restreints (env. 20 élèves)</strong> en Français, Mathématiques et Anglais.
              </p>
              <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
                <span className="text-2xl">🐾</span>
                <p className="text-[11px] font-bold text-blue-800 leading-tight">Médiation animale : nos chiens accompagnent les élèves en Vie Scolaire.</p>
              </div>
            </section>

            <section className="bg-white/20 p-5 rounded-2xl">
              <h4 className="font-bold text-sm mb-2 uppercase">🛡️ Sécurité & Cadre</h4>
              <p className="text-[11px] leading-relaxed italic">
                <strong>Un élève = une salle attitrée.</strong> Limitation des déplacements, surveillance accrue et absence de sorties libres pour garantir un environnement serein.
              </p>
            </section>
            <section className="bg-[#0f6a8e] p-4 rounded-xl flex items-center gap-4">
              <span className="text-2xl">⚽</span>
              <p className="text-[10px] leading-tight font-medium uppercase tracking-tight">
                Sections sportives & partenariats : <br/>USMEF Foot, BMFB Basket , Équitation Centre Alisa.
              </p>
            </section>
          </div>
  
        </div>
        {/* --- VOLET DROIT : LYCÉE (EXCELLENCE & FILIÈRES) --- */}
        <div className="w-[99mm] h-full relative p-10 bg-[#e94f8a] flex flex-col">
          <h3 className="text-5xl font-black italic uppercase leading-none mb-8">Lycée</h3>
          
          <div className="flex-grow space-y-4">
            {/* 1. INTERNATIONAL */}
            <section className="bg-white text-gray-800 p-6 rounded-2xl shadow-xl">
              <h4 className="font-black text-sm uppercase text-[#e94f8a] mb-4">🌎 Ambition Internationale</h4>
              <div className="space-y-3">
                <ul className="text-[11px] space-y-1 font-semibold">
                  <li>• Dual Diploma USA</li>
                  <li>• Certifications Cambridge et Voltaire</li>
                  <li>• Brevet d&apos;Initiation Aéronautique (BIA)</li>
                  <li>• Option LLCE Anglais & Section Euro</li>
                </ul>
              </div>
            </section>

            {/* 2. FOCUS FILIÈRE ST2S (Version courte) */}
            <section className="bg-[#b52a5d] p-5 rounded-2xl border-2 border-white/30 shadow-lg relative">
              <h4 className="font-black text-lg uppercase tracking-tighter mb-1">🏥 Bac ST2S</h4>
              <p className="text-[11px] leading-relaxed opacity-95 italic">
                L&apos;expertise paramédicale et sociale. Un accompagnement ciblé pour réussir vos concours et l&apos;accès aux études supérieures.
              </p>
            </section>

            {/* 3. RÉUSSITE & ORIENTATION (Nouveau bloc stratégique) */}
            <section className="bg-white text-gray-800 p-6 rounded-2xl shadow-xl">
              <h4 className="font-black text-sm uppercase text-[#e94f8a] mb-3">🚀 Réussite & Avenir</h4>
              <p className="text-[11px] leading-relaxed mb-3 font-medium">
                Nous préparons nos élèves à l&apos;intégration des <strong>Grandes Écoles</strong> et des filières sélectives.
              </p>
              <ul className="text-[11px] space-y-1">
                <li className="flex items-center gap-2">🎓 Suivi Parcoursup : Accompagnement individualisé pour chaque lycéen.</li>
                <li className="flex items-center gap-2">📈 Excellence : Coaching méthodologique et préparation aux attentes du supérieur.</li>
              </ul>
            </section>

            {/* 4. CADRE DE VIE (Compacté) */}
            <section className="bg-[#9b1d50] p-5 rounded-2xl">
              <h4 className="font-bold mb-2 uppercase text-[#fbb800]">🏠 Vie du Lycéen</h4>
              <p className="text-[11px] leading-tight opacity-95">
                <strong>Internat de semaine</strong> (cadre de travail structuré) et <strong>Pôle Bien-Être</strong> (Infirmière & Psychologue salariés) pour un suivi quotidien.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
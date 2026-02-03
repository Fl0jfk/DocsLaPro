export default function DepliantProvidenceVerso() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-[#cfcfd8] p-10 font-sans">
      <section id="mon-flyer-a-imprimer" className="relative w-[297mm] h-[210mm] bg-white overflow-hidden shadow-2xl flex flex-col text-white">
        
        {/* LE FOND : Les 3 colonnes qui descendent jusqu'en bas */}
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full bg-[#fbb800]"></div>
          <div className="w-1/3 h-full bg-[#18aae2] border-x border-white/10"></div>
          <div className="w-1/3 h-full bg-[#e94f8a]"></div>
        </div>

        {/* CONTENU (z-10 pour être au-dessus du fond) */}
        <div className="relative z-10 flex flex-col h-full w-full">
          
          {/* ============================================================
              HAUT : TES SECTIONS ÉCOLE / COLLÈGE / LYCÉE (TEXTES ORIGINAUX)
              ============================================================ */}
          <div className="flex h-[62%] w-full">
            {/* ÉCOLE */}
            <div className="w-1/3 h-full p-8 flex flex-col">
              <h3 className="text-4xl font-black italic uppercase leading-none mb-4">École</h3>
              <div className="space-y-4">
                <section className="bg-white/20 p-4 rounded-xl border border-white/40 shadow-inner">
                  <h4 className="font-bold text-[15px] mb-1 uppercase tracking-tighter">🌱 ÉVEIL & AUTONOMIE</h4>
                  <p className="text-[12px] leading-relaxed">Lieu de vie à taille humaine, notre école favorise l&apos;autonomie. La pédagogie de projet stimule la curiosité naturelle de chaque enfant.</p>
                </section>
                <section className="bg-[#d9a600] p-5 rounded-2xl border border-white/20">
                  <h4 className="font-bold text-[15px] mb-3 uppercase flex items-center gap-2">
                    <span>🎨</span> Une École en Mouvement
                  </h4>
                  <ul className="text-[12px] space-y-2 font-medium">
                    <li className="flex items-start gap-2">
                      • <strong>Sorties Culturelles  </strong>Opéra de Rouen, Bibliothèque, Musées de la Métropole.
                    </li>
                  </ul>
                </section>
                <section className="bg-white text-gray-800 p-4 rounded-xl shadow-lg">
                  <h4 className="font-bold text-[15px] mb-2 uppercase text-[#fbb800] border-b pb-1">🕒 Horaires</h4>
                  <div className="text-[12px] space-y-1 font-medium">
                    <p className="flex justify-between"><span>Accueil :</span> <span>07h30</span></p>
                    <p className="flex justify-between"><span>Classe :</span> <span>08h30-16h30</span></p>
                    <p className="flex justify-between text-[#fbb800]"><span>Étude/Garderie :</span> <span>jusqu&apos;à 18h30</span></p>
                  </div>
                </section>
              </div>
            </div>

            {/* COLLÈGE */}
            <div className="w-1/3 h-full p-8 flex flex-col border-x border-white/10">
              <h3 className="text-4xl font-black italic uppercase leading-none mb-4">Collège</h3>
              <div className="flex-grow space-y-4">
                <section className="bg-white text-gray-800 p-4 rounded-xl shadow-xl">
                  <h4 className="font-black text-[15px] uppercase text-[#18aae2] mb-1 flex items-center gap-2">
                    <span>🤝</span> Réussir ensemble
                  </h4>
                  <p className="text-[12px] leading-relaxed">
                    Pour les élèves à besoins particuliers, nous proposons des <strong>groupes restreints (env. 20 élèves)</strong> en <span className="font-bold">Français, Mathématiques et Anglais</span> pour un suivi intensif et personnalisé.
                  </p>
                </section>
                <section className="bg-[#0f6a8e] p-5 rounded-2xl border border-white/30 shadow-lg">
                  <h4 className="font-bold text-[15px] mb-1 uppercase tracking-tighter text-[#fbb800]">🎨 Ateliers</h4>
                  <div className="grid grid-cols-2 gap-y-1 gap-x-1">
                    <p className="text-[12px] flex items-center gap-2">♟️ Échecs & Jeux</p>
                    <p className="text-[12px] flex items-center gap-2">🎭 Théâtre</p>
                    <p className="text-[12px] flex items-center gap-2">🎤 Chorale</p>
                    <p className="text-[12px] flex items-center gap-2">🧵 Couture</p>
                    <p className="text-[12px] flex items-center gap-2 col-span-2">✍️ Club Presse (Journal du collège)</p>
                  </div>
                </section>
                <section className="bg-white p-4 rounded-xl shadow-xl">
                  <h4 className="font-bold text-[15px] mb-1 uppercase tracking-tighter text-[#18aae2] font-black">🏆 Dynamisme</h4>
                  <p className="text-[12px] leading-relaxed italic text-black">
                    Sections sportives et partenariats : USMEF Foot, BMFB Basket, Équitation Centre Alisa.
                  </p>
                </section>
              </div>
            </div>

            {/* LYCÉE */}
            <div className="w-1/3 h-full p-8 flex flex-col">
              <h3 className="text-4xl font-black italic uppercase leading-none mb-4">Lycée</h3>
              <div className="flex-grow space-y-3">
                <section className="bg-white text-gray-800 p-4 rounded-xl shadow-lg border-l-4 border-[#b52a5d]">
                  <h4 className="font-black text-[15px] uppercase text-[#e94f8a] mb-1">🎓 Bac Général</h4>
                  <p className="text-[14px] font-bold leading-tight mb-1">8 Spécialités au choix</p>
                  <p className="text-[12px] leading-tight text-gray-600">
                    Une offre large incluant les <span className="text-[#e94f8a] font-bold underline decoration-1">Sciences de l&apos;Ingénieur</span>, pour préparer les futurs profils scientifiques et technologiques.
                  </p>
                </section>
                <section className="bg-[#b52a5d] p-4 rounded-xl border-2 border-white/30 shadow-md">
                  <h4 className="font-black text-[15px] uppercase mb-1 flex items-center gap-2">
                    <span>🏥</span> Bac ST2S
                  </h4>
                  <p className="text-[12px] opacity-90 leading-tight italic">
                    Filière d&apos;expertise paramédicale et sociale pour réussir les concours et l&apos;accès au supérieur.
                  </p>
                </section>
                <section className="bg-white text-gray-800 p-6 rounded-2xl shadow-xl">
                  <h4 className="font-black text-[15px] uppercase text-[#e94f8a] mb-3 flex items-center gap-2">
                    <span>🚀</span> Réussite & Avenir
                  </h4>
                  <div className="space-y-3">
                    <p className="text-[12px] leading-tight font-medium">
                      Préparation aux <strong>Grandes Écoles</strong> et filières sélectives.
                    </p>
                    <div className="pt-1">
                      <p className="text-[12px] leading-tight text-gray-600">
                        Coaching méthodologique et suivi <strong>Parcoursup</strong> individualisé pour chaque élève.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* ============================================================
              BAS : TES TEXTES "GROUPE" DANS LE DESIGN CAPSULE SOMBRE
              ============================================================ */}
          <div className="flex-grow w-full flex flex-col justify-center px-8 gap-3 mb-[30px]">
            
            {/* 1. INTERNATIONAL */}
            <div className="relative min-h-[80px] flex items-center">
              <div className="absolute inset-0 bg-gray-900/90 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-sm"></div>
              <div className="relative z-10 flex items-center w-full px-6 py-3">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center text-5xl shadow-lg">🌎</div>
                <div className="ml-6 flex flex-col gap-1">
                  <h4 className="font-black text-xl uppercase text-white leading-none">Ambition Internationale</h4>
                  <p className="text-[13px] text-white">
                    <span className="font-bold">École :</span> Initiation Anglais dès la maternelle • 
                    <span className="font-bold"> Collège :</span> Option Bi-langue (Double dès la 6ème LV1 Anglais/Allemand) ou LCE Anglais • 
                    <span className="font-bold"><br/> Lycée :</span> Dual Diploma USA, Cambridge, Section européenne, LV3 Italien ou Russe.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. BIEN-ÊTRE */}
            <div className="relative min-h-[80px] flex items-center">
              <div className="absolute inset-0 bg-gray-900/90 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-sm"></div>
              <div className="relative z-10 flex items-center w-full px-6 py-3">
                <div className="w-16 h-16 shrink-0 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg">🐾</div>
                <div className="ml-6 flex flex-col gap-1">
                  <h4 className="font-black text-xl uppercase text-white leading-none">Pôle Bien-Être & Santé</h4>
                  <p className="text-[13px] text-white leading-tight">Infirmière & Psychologue sur site • Médiation animale (chiens en vie scolaire) • Internat de semaine (Collège/Lycée).</p>
                </div>
              </div>
            </div>

            {/* 3. SÉCURITÉ */}
            <div className="relative min-h-[80px] flex items-center">
              <div className="absolute inset-0 bg-gray-900/90 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-sm"></div>
              <div className="relative z-10 flex items-center w-full px-6 py-3">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center text-5xl shadow-lg">🤝</div>
                <div className="ml-6 flex flex-col gap-1">
                  <h4 className="font-black text-xl text-white uppercase leading-none">Cadre de Vie & Solidarité</h4>
                  <p className="text-[13px] text-white">
                    <span className="font-bold uppercase">Sécurité :</span> Un élève = une salle attitrée, limitation des flux et absence de sorties libres pour garantir un environnement serein.
                    <span className="font-bold uppercase ml-4"><br/>Solidarité :</span> Accueil de tous avec grille tarifaire en 5 catégories.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
  
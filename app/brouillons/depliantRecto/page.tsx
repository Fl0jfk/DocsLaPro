"use client"

import Image from "next/image";

export default function DepliantProvidenceRecto() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-[#cfcfd8] p-10">
      {/* Container Format A4 Paysage */}
      <section id="mon-flyer-a-imprimer" className="relative w-[297mm] h-[210mm] bg-white overflow-hidden shadow-2xl flex">
        
        {/* Lignes de repère pour les plis (uniquement pour le dev) */}
        <div className="absolute top-0 left-[99mm] w-[1px] h-full bg-gray-200 z-[100] border-dashed border-l" />
        <div className="absolute top-0 left-[198mm] w-[1px] h-full bg-gray-200 z-[100] border-dashed border-l" />

        {/* VOLET 1 (Gauche) - Souvent le volet intérieur quand on ouvre */}
        <div className="w-[99mm] h-full relative border-r p-6 flex flex-col justify-between bg-slate-50">
          <div>
            <h3 className="text-[#18aae2] font-extrabold text-xl italic mb-6 uppercase tracking-wider">Envie de nous rejoindre ?</h3>
            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#e94f8a] text-white flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <p className="text-sm font-bold leading-tight">Pré-inscription en ligne</p>
                  <p className="text-[11px] text-gray-500">Rendez-vous sur notre site web (rubrique Inscriptions)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#18aae2] text-white flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <p className="text-sm font-bold leading-tight">Étude du dossier</p>
                  <p className="text-[11px] text-gray-500">Nous étudions chaque profil avec bienveillance</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#fbb800] text-white flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <p className="text-sm font-bold leading-tight">Rencontre</p>
                  <p className="text-[11px] text-gray-500">Un entretien avec la direction pour valider le projet de l'enfant</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white/60 p-4 rounded-xl border border-white shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="text-[12px] leading-tight text-gray-700">
                      <strong>La Providence Nicolas Barré</strong><br />
                      6, rue de Neuvillette<br />
                      76240 Le Mesnil-Esnard
                    </p>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/50 text-[11px] text-gray-600 italic">
                      <span>🚌</span>
                      <p>Réseau de transports scolaires & urbains</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/60 p-4 rounded-xl border border-white shadow-sm flex items-center gap-3">
                <span className="text-lg">📞</span>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Accueil</p>
                  <p className="text-sm font-bold text-gray-800">02 32 86 50 90</p>
                </div>
              </div>

            </div>
          </div>
          <div className="bg-[#18aae2] rounded-2xl p-5 shadow-lg flex flex-col items-center text-center text-white">
            <p className="font-black text-lg leading-tight uppercase mb-1">Portes Ouvertes</p>
            <p className="font-bold text-md italic mb-4">Samedi 14 mars 2026</p>
            <div className="p-2 bg-white rounded-xl mb-3">
              <Image  src="/QR Code Portes Ouvertes.png"  width={100}  height={100}  alt="QR Code Inscription" />
            </div>
            <p className="text-[10px] font-medium leading-tight opacity-90 uppercase tracking-tighter">Flashez pour réserver votre visite</p>
          </div>
          <div className="flex justify-center items-center mt-4 px-2">
            <p className="text-[10px] font-bold">https://laprovidence-nicolasbarre.fr/</p>
          </div>
        </div>
        {/* VOLET 2 (Milieu) - Le dos du dépliant une fois plié */}
        <div className="w-[99mm] h-full relative p-8 flex flex-col items-center justify-between bg-white overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#18aae2]/5 z-0" />
          <div className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full bg-[#e94f8a]/5 z-0" />
          <div className="relative z-10 w-full flex flex-col items-center flex-grow justify-between">
            <div className="text-center mt-4">
              <div className="text-[#18aae2] text-4xl font-serif opacity-30 mb-2 leading-none">“</div>
              <h2 className="text-2xl font-black text-gray-800 italic uppercase leading-tight tracking-tighter">
                Un passeport <br />
                <span className="text-[#e94f8a]">pour l'avenir</span>
              </h2>
              <p className="mt-4 text-[13px] text-gray-500 font-medium italic leading-tight max-w-[220px] mx-auto">Exigence, respect, bienveillance : La Providence Nicolas Barré, un cadre qui élève.</p>
              <div className="w-12 h-1 bg-[#fbb800] mx-auto mt-6 rounded-full"></div>
            </div>
            <div className="w-full grid grid-cols-2 gap-2 mt-[120px] my-6">
              <div className="text-center p-4 border-b border-r border-gray-100">
                <p className="text-[#18aae2] font-black text-2xl">100%</p>
                <p className="text-[10px] uppercase text-gray-600 font-bold leading-tight">Réussite <br/>au Brevet</p>
              </div>
              <div className="text-center p-4 border-b border-gray-100">
                <p className="text-[#e94f8a] font-black text-2xl">100%</p>
                <p className="text-[10px] uppercase text-gray-600 font-bold leading-tight">Réussite <br/>au Bac</p>
              </div>
              <div className="text-center p-4 border-r border-gray-100">
                <p className="text-[#fbb800] font-black text-2xl">7000</p>
                <p className="text-[10px] uppercase text-gray-600 font-bold leading-tight">Élèves <br/>accompagnés</p>
              </div>
              <div className="text-center p-4">
                <p className="text-gray-400 font-black text-2xl">90</p>
                <p className="text-[10px] uppercase text-gray-600 font-bold leading-tight">Années <br/>d'excellence</p>
              </div>
            </div>
            <div className="w-full mt-auto">
              <p className="text-[8px] text-center text-gray-400 uppercase tracking-[0.2em] mb-4 font-bold">Établissement sous contrat d'association</p>
              <div className="flex justify-around items-center opacity-70 grayscale">
                <div className="w-16 h-16 rounded flex items-center justify-center text-[7px] text-center p-1">
                  <Image src="/Logo Académie.png" width={130} height={130} alt="Logo"/>
                </div>
                <div className="w-16 h-16 rounded flex items-center justify-center text-[7px] text-center p-1">
                  <Image src="/Logo ECHN.jpg" width={130} height={130} alt="Logo"/>
                </div>
                <div className="w-16 h-16 rounded flex items-center justify-center text-[7px] text-center p-1">
                  <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" width={130} height={130} alt="Logo"/>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-[99mm] h-full relative flex flex-col items-center">
          <p className="z-20 mt-10 text-xl text-white font-bold italic">La Providence Nicolas Barré</p>
          <div className="flex gap-2 mt-4">
            <p className="z-20 text-xl text-white font-bold italic">Ecole</p>
            <p className="z-20 text-xl text-white font-bold italic">-</p>
            <p className="z-20 text-xl text-white font-bold italic">Collège</p>
            <p className="z-20 text-xl text-white font-bold italic">-</p>
            <p className="z-20 text-xl text-white font-bold italic">Lycée</p>
          </div>
          <Image src="/PigeonnierLaPro.jpg" alt="Logo" fill className="z-10 "/>
          <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" width={130} height={130} alt="Logo" className="z-20 mt-[500px]"/>    
        </div>
      </section>
    </main>
  );
}
export default function DepliantProvidenceVerso() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-[#cfcfd8] p-10 font-sans">
      <section id="mon-flyer-a-imprimer" className="relative w-[297mm] h-[210mm] bg-white overflow-hidden shadow-2xl flex flex-col text-white">
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full bg-[#fbb800]"></div>
          <div className="w-1/3 h-full bg-[#18aae2] border-x border-white/10"></div>
          <div className="w-1/3 h-full bg-[#e94f8a]"></div>
        </div>
        <div className="relative z-10 flex flex-col h-full w-full">
          <div className="flex h-[68%] w-full">
            <div className="w-1/3 h-full p-6 flex flex-col">
              <h3 className="text-4xl font-black italic uppercase leading-none mb-6">École</h3>
              <div className="space-y-4">
                <section className="bg-white text-gray-800 p-5 rounded-2xl shadow-xl">
                  <h4 className="font-black text-[16px] mb-2 uppercase text-[#fbb800] flex items-center gap-2">
                    <span>🧠</span> Psychologue
                  </h4>
                  <p className="text-[14px] leading-snug text-gray-700">
                    Votre enfant peut rencontrer des moments de doute, de tristesse ou de colère, il peut parfois avoir des difficultés avec ses camarades ou manquer de confiance en lui. Le psychologue lui offre un <span className="font-bold">espace confidentiel doux et rassurant</span> pour exprimer ses émotions, mettre des mots sur ce qu&apos;il ressent et trouver des solutions adaptées.
                  </p>
                </section>
                <section className="bg-white text-gray-800 p-5 rounded-2xl shadow-xl">
                  <h4 className="font-black text-[16px] mb-2 uppercase text-[#fbb800] flex items-center gap-2">
                    <span>🩺</span> Infirmière
                  </h4>
                  <p className="text-[14px] leading-snug text-gray-700">
                    Présente au quotidien, l&apos;infirmière veille au <span className="font-bold">bien-être physique et préventif</span> de votre enfant : prise en charge des petits bobos, conseils santé et hygiène de vie, écoute active en cas de besoin et actions de prévention adaptées à l&apos;âge des élèves.
                  </p>
                </section>
              </div>
            </div>
            <div className="w-1/3 h-full p-6 flex flex-col border-x border-white/10">
              <h3 className="text-4xl font-black italic uppercase leading-none mb-6">Collège</h3>
              <div className="space-y-4">
                <section className="bg-white text-gray-800 p-5 rounded-2xl shadow-xl border-t-4 border-[#18aae2]">
                  <h4 className="font-black text-[16px] mb-2 uppercase text-[#18aae2] flex items-center gap-2">
                    <span>🧠</span> Psychologue
                  </h4>
                  <p className="text-[14px] leading-snug text-gray-700">
                    Votre enfant peut traverser des périodes plus sensibles. Le psychologue lui propose un espace confidentiel d&apos;écoute pour le <span className="font-bold">stress, l&apos;anxiété, le harcèlement</span>, les conflits ou le manque de motivation. Ces entretiens permettent de mettre des mots sur ses ressentis et de trouver des solutions adaptées.
                  </p>
                </section>
                <section className="bg-white text-gray-800 p-5 rounded-2xl shadow-xl border-t-4 border-[#18aae2]">
                  <h4 className="font-black text-[16px] mb-2 uppercase text-[#18aae2] flex items-center gap-2">
                    <span>🩺</span> Infirmière
                  </h4>
                  <p className="text-[14px] leading-snug text-gray-700">
                    Assure les soins, le suivi de santé et des conseils personnalisés. Elle mène des actions d&apos;éducation à la prévention (<span className="font-bold">hygiène de vie, sommeil, alimentation, écrans</span>) et oriente vers des professionnels extérieurs si nécessaire.
                  </p>
                </section>
              </div>
            </div>
            <div className="w-1/3 h-full p-6 flex flex-col">
              <h3 className="text-4xl font-black italic uppercase leading-none mb-6">Lycée</h3>
              <div className="space-y-4">
                <section className="bg-white text-gray-800 p-5 rounded-2xl shadow-xl border-t-4 border-[#e94f8a]">
                  <h4 className="font-black text-[16px] mb-2 uppercase text-[#e94f8a] flex items-center gap-2">
                    <span>🧠</span> Psychologue
                  </h4>
                  <p className="text-[14px] leading-snug text-gray-700">
                    Consultations confidentielles pour accompagner la gestion du stress des examens, l&apos;orientation scolaire, les projets d&apos;avenir et le développement de la <span className="font-bold">confiance en soi</span>. L&apos;objectif est d&apos;aider l&apos;élève à mieux comprendre ses émotions et renforcer ses ressources personnelles.
                  </p>
                </section>
                <section className="bg-white text-gray-800 p-5 rounded-2xl shadow-xl border-t-4 border-[#e94f8a]">
                  <h4 className="font-black text-[16px] mb-2 uppercase text-[#e94f8a] flex items-center gap-2">
                    <span>🩺</span> Infirmière
                  </h4>
                  <p className="text-[14px] leading-snug text-gray-700">
                    Assure un accompagnement dans le suivi de santé, les actions de prévention et l&apos;éducation à la santé. Avec un <span className="font-bold">accompagnement individualisé</span>, elle constitue un repère rassurant pour les élèves au sein de l&apos;établissement.
                  </p>
                </section>
              </div>
            </div>
          </div>
          <div className="flex-grow w-full flex flex-col justify-center p-6 mb-[40px]">
            <div className="relative min-h-[160px] flex items-center">
              <div className="absolute inset-0 bg-gray-900/95 rounded-3xl shadow-2xl"></div>
              <div className="relative z-10 flex items-center w-full px-10 py-6">
                <div className="w-20 h-20 shrink-0 bg-white rounded-2xl flex items-center justify-center text-5xl shadow-[0_0_20px_rgba(255,255,255,0.2)]">🐾</div>
                <div className="ml-8 flex flex-col gap-2">
                  <h4 className="font-black text-2xl uppercase text-white tracking-tighter">Médiation Animale <span className="text-[#fbb800]">— Pepsi & Hopa</span></h4>
                  <div className="grid grid-cols-1 gap-2">
                    <p className="text-[13px] text-gray-200 leading-relaxed">
                      La médiation animale constitue un <span className="text-[#18aae2] font-bold">outil complémentaire</span> pour soutenir le bien-être des élèves dans un cadre sécurisé et bienveillant. Cette approche innovante offre aux élèves un autre moyen de s’exprimer et de se détendre. 
                    </p>
                    <p className="text-[13px] text-gray-200 leading-relaxed">
                      La présence de l’animal facilite l’expression, renforce le sentiment de sécurité et encourage des interactions positives.
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="px-3 py-1 bg-[#fbb800]/20 border border-[#fbb800]/40 rounded-full">
                        <p className="text-[#fbb800] text-[10px] font-bold uppercase tracking-wider">
                          🚀 École : Projets d&apos;ateliers en cours
                        </p>
                      </div>
                      <div className="px-3 py-1 bg-[#e94f8a]/20 border border-[#e94f8a]/40 rounded-full">
                        <p className="text-[#e94f8a] text-[10px] font-bold uppercase tracking-wider">
                          📍 Collège & Lycée : Déjà en place
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
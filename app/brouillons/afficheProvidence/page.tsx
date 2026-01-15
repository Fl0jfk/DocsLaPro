"use client"

import Image from "next/image";

export default function AfficheProvidence() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-[#cfcfd8]">
      <section className="relative w-[210mm] h-[297mm] bg-white overflow-hidden shadow-2xl">
        <div className="absolute top-[480px] left-[-120px] w-[200px] h-[200px] rounded-full bg-white border-[40px] border-[#e94f8a] shadow-[0_10px_25px_rgba(0,0,0,0.12)]"/>
        <div className="absolute top-[120px] left-[-65px] w-[600px] h-[600px] rounded-full bg-[#fbb800] shadow-[0_10px_25px_rgba(0,0,0,0.12)] z-10" />
        <div className="absolute top-[-250px] left-[-200px] w-[300px] h-[300px] rounded-full bg-white border-[#18aae2] border-[60px] shadow-[0_10px_25px_rgba(0,0,0,0.12)] z-50" />
        <div className="absolute top-[-150px] right-[-120px] w-[300px] h-[300px] rounded-full bg-white border-[#18aae2] border-[60px] shadow-[0_10px_25px_rgba(0,0,0,0.12)] z-50" />
        <div className="absolute top-[550px] left-[740px] w-[300px] h-[300px] rounded-full bg-white border-[#fbb800] border-[60px] shadow-[0_10px_25px_rgba(0,0,0,0.12)] z-50" />
        <div className="absolute top-[400px] right-[180px] w-[300px] h-[300px] rounded-full bg-[#e94f8a] shadow-[0_10px_25px_rgba(0,0,0,0.12)] z-[0]" />
        <header className="relative z-10 flex justify-between items-start p-10">
          <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" alt="Logo" width={110} height={110}/>
        </header>
        <section className="relative z-10 mt-10 ml-10 max-w-md">
          <h2 className="text-5xl font-extrabold leading-tight text-white italic">Ecole - Collège - Lycée</h2>
          <p className="mt-6 text-5xl font-extrabold leading-tight italic">La Providence Nicolas Barré</p>
          <p className="mt-6 text-5xl font-extrabold leading-tight text-white w-[70%] italic">Un passeport pour l&apos;avenir</p>
        </section>
        <Image src="/Photos affiche 1.jpg" width={200} height={200} alt="" className="absolute left-[460px] rounded-xl top-[40px] shadow-[0_10px_25px_rgba(0,0,0,0.12)] z-10 rotate-3"/>
        <Image src="/Photos affiche 2.webp" width={280} height={150} alt="" className="absolute left-[400px] rounded-xl top-[450px] shadow-[0_10px_25px_rgba(0,0,0,0.12)] z-50 rotate-3"/>
        <Image src="/Photos affiche 3.jpg.webp" width={300} height={220} alt="" className="absolute left-[480px] rounded-xl top-[300px] shadow-[0_10px_25px_rgba(0,0,0,0.12)] z-20 rotate-3"/>
        <section className="absolute top-[740px] w-full flex justify-center items-center gap-8 z-10">
          <div className="rounded-2xl h-[205px] w-[225px] bg-white/90 backdrop-blur-sm flex flex-col items-start justify-start text-black shadow-[0_15px_30px_rgba(0,0,0,0.1)] p-6 border-t-4 border-[#fbb800]">
            <h4 className="font-bold mb-3 flex items-center gap-2 text-[#fbb800]">
              <span>🏆</span> Partenariats
            </h4>
            <ul className="space-y-2 text-[13px] leading-tight">
              <li className="flex items-start gap-2">
                <span>🤝</span> 
                <span><strong>Clubs sportifs :</strong> Football & Basket</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🏇</span> 
                <span><strong>Équitation :</strong> Centre partenaire</span>
              </li>
              <hr className="w-full border-gray-200 my-1" />
              <li className="flex items-start gap-2 italic text-gray-600">
                <span>🎭</span> 
                <span>Sorties culturelles & théâtre</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl h-[205px] w-[225px] bg-white/90 backdrop-blur-sm flex flex-col items-start justify-start text-black shadow-[0_15px_30px_rgba(0,0,0,0.1)] p-6 border-t-4 border-[#18aae2]">
            <h4 className="font-bold mb-3 flex items-center gap-2 text-[#18aae2]">
              <span>🌍</span> Langues
            </h4>
            <ul className="space-y-2 text-md">
              <li className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <Image src="https://flagcdn.com/w40/gb.png"  alt="UK"  width={20} height={30} className="rounded-full border border-white shadow-sm"/>
                  <Image  src="https://flagcdn.com/w40/de.png"  alt="Germany" width={20} height={30} className="rounded-full border border-white shadow-sm"/>
                </div>
                <span className="text-sm font-medium">Bilangue Anglais-Allemand</span>
              </li>
              <li className="flex items-center gap-2">📚 Anglais renforcé, LLCE</li>
            </ul>
          </div>
          <div className="rounded-2xl h-[205px] w-[225px] bg-white/90 backdrop-blur-sm flex flex-col items-start justify-start text-black shadow-[0_15px_30px_rgba(0,0,0,0.1)] p-6 border-t-4 border-[#e94f8a]">
            <h4 className="font-bold mb-3 flex items-center gap-2 text-[#e94f8a]">
              <span>🤝</span> Vie Scolaire
            </h4>
            <ul className="space-y-2 text-md">
              <li className="flex items-center gap-2">🏠 Internat</li>
              <li className="flex items-center gap-2">🌟 Besoins particuliers</li>
              <li className="flex items-center gap-2">🐾 Médiation animale</li>
            </ul>
          </div>
        </section>
        <section className="absolute top-[950px] flex w-full p-4 px-8 justify-between items-center">
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-bold">Portes Ouvertes 14 mars 2026</p>
            <p className="text-2xl">Inscrivez-vous en flashant le QR-CODE</p>
          </div>          
          <Image src="/QR Code Portes Ouvertes.png" width={150} height={150} alt="QR" className="rounded-xl"/>
        </section>
      </section>
    </main>
  );
}
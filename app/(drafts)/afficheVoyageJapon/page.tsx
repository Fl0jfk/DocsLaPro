import Image from "next/image";
import LogoJapon from "../../../public/Logo La Providence JAPON.jpg"
import QrCode from "../../../public/qr_code_japon.png"

export default function AfficheVoyageJapon() {
  return (
    <section className="min-h-screen bg-black text-white font-sans p-8 md:p-16">
      <section className="flex flex-col items-start text-center mb-8">
        <div className="flex gap-8">
            <div className="relative inline-block">
              <Image src={LogoJapon} alt="Logo Nicolas Barré Japon" width={140} height={140} unoptimized quality={100} className="object-contain shadow-2xl"/>  
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase italic self-center">Destination <span className="text-red-600">Japon</span></h1>
        </div>
        <p className="mt-14 text-xl text-gray-400 max-w-2xl self-center">Une odyssée unique entre <span className="text-white font-semibold">tradition ancestrale</span> et <span className="text-white font-semibold">futurisme urbain</span>. Plus qu'un séjour pédagogique, une révélation culturelle.</p>
      </section>

      <div className="grid grid-cols-2 gap-8 max-w-6xl mx-auto py-6">
        <div className="border border-white/20 px-6 py-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800/50 transition-all group">
          <h2 className="text-2xl font-bold text-red-600 mb-6 uppercase tracking-widest">L'Immersion</h2>
          <ul className="space-y-4 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-red-600">⛩️</span> 
              <span>Nuits magiques en <strong>Ryokan</strong> traditionnel à Hakone.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600">⛰️</span> 
              <span>Éveil face au <strong>Mont Fuji</strong> et croisière sur le lac Ashi.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600">🤖</span> 
              <span>Exploration des quartiers futuristes de <strong>Shibuya & Akihabara</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600">🎨</span> 
              <span>Plongée dans l'imaginaire au <strong>Musée Ghibli</strong>.</span>
            </li>
          </ul>
        </div>
        <div className="border border-white/20 px-6 py-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800/50 transition-all">
          <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest">La Découverte</h2>
          <ul className="space-y-4 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-white">🥁</span> 
              <span>Ateliers Rythmiques : Initiation au <strong>Taiko</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-white">🖋️</span> 
              <span>Maîtrise du trait : Ateliers <strong>Manga & Calligraphie</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-white">🎬</span> 
              <span>Cycles exclusifs au <strong>Cinéma Omnia</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-white">🍜</span> 
              <span>Saveurs authentiques lors de la <strong>Semaine Asiatique</strong>.</span>
            </li>
          </ul>
        </div>
      </div>
      <section className="mt-8 max-w-6xl mx-auto grid grid-cols-3 gap-8 items-end">
        <div className="col-span-2">
          <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter italic">Votre odyssée commence ici</h2>
          <div className="relative border-l-2 border-red-600/30 ml-4 pl-10 space-y-6">
            <div className="relative">
              <span className="absolute -left-[45px] top-1 w-6 h-6 bg-black border-2 border-red-600 rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
              </span>
              <h3 className="font-black text-xl text-white uppercase italic">2026 : L'Éveil Culturel</h3>
              <p className="text-sm text-gray-400 mt-1 uppercase tracking-tight font-semibold">Club Cinéma • Arts Martiaux • Gastronomie</p>
            </div>
            <div className="relative">
              <span className="absolute -left-[45px] top-1 w-6 h-6 bg-black border-2 border-white rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
              </span>
              <h3 className="font-black text-xl text-white uppercase italic">Hiver 2026 : Le Partage</h3>
              <p className="text-sm text-gray-400 mt-1 uppercase tracking-tight font-semibold italic text-red-500">Collecte Trousse à Projets & Marché asiatique</p>
            </div>
            <div className="relative">
              <span className="absolute -left-[45px] top-1 w-6 h-6 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] rounded-full"></span>
              <h3 className="font-black text-2xl text-red-600 uppercase italic">Avril 2027 : L'Apothéose</h3>
              <p className="text-white text-lg font-semibold mt-1 uppercase tracking-tighter">Décollage pour Tokyo</p>
            </div>
          </div>
        </div>
        <div className="bg-red-600 py-5 px-1 rounded-3xl text-white flex flex-col gap-4 shadow-lg h-fit">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Pour en savoir plus,</p>
            <h4 className="text-lg font-bold leading-tight">flashez le Qr Code !</h4>
          </div>
          <div className="bg-white p-1 rounded-xl aspect-square flex items-center justify-center mx-auto w-32">
               <Image src={QrCode} alt="" width={300} height={300}/>
          </div>
          <p className="text-[9px] text-center font-bold uppercase leading-tight opacity-90 italic">
            
          </p>
        </div>
      </section>
      <footer className="mt-8 border-t border-zinc-900 text-center pt-8">
        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.5em]">La Providence Nicolas Barré • Projet Japon • Avril 2027</p>
      </footer>
    </section>
  );
}
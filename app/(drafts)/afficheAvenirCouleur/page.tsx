"use client"

import Image from "next/image";
import Logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp"
import Background from "../../../public/PigeonnierLaPro.jpg" 
import QRCode from "../../../public/QR Code Portes Ouvertes.png"

export default function AffichePortesOuvertes() {
  return (
    <section className="flex justify-center items-center min-h-screen font-sans">
      <section className="relative w-[210mm] h-[297mm] bg-white overflow-hidden shadow-2xl flex flex-col p-10">
        <div className="absolute inset-0 z-0">
          <Image src={Background} alt="Fond" fill className="object-cover opacity-70" priority/>
        </div>
        <div className="mb-8 relative overflow-hidden mt-4 z-10">
          <div className="relative z-10">
            <h4 className="text-7xl font-black italic uppercase leading-none text-shadow-lg text-center">Portes Ouvertes</h4>
            <div className="flex items-end gap-6">
                <p className="text-5xl text-gray-900 mt-2 text-shadow-lg italic">SAMEDI 14 MARS</p>
                <p className="text-4xl font-bold tracking-widest opacity-70 mb-1 italic text-gray-900 text-shadow-lg">8H30 — 12H00</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 flex-grow z-10 mt-4">
          <div className="bg-red-600 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-lg relative">
            <div className="absolute top-4 right-6 text-5xl opacity-20 italic font-black text-black">JAPON</div>
            <div>
              <span className="text-4xl">⛩️</span>
              <h3 className="text-2xl font-black uppercase italic mt-4 leading-none">Stand Spécial <br/>Voyage 2027</h3>
            </div>
            <p className="text-[15px]t">Présentation du projet pédagogique en avant-première.</p>
          </div>
          <div className="bg-[#e94f8a] rounded-[2.5rem] p-8 flex flex-col justify-between">
            <div>
              <span className="text-4xl">🐾</span>
              <h3 className="text-2xl font-black text-white uppercase italic mt-4">Stand Bien-être & <br/>Médiation</h3>
            </div>
            <p className="text-[15px] font-bold text-gray-700 leading-tight">
              Rencontrez notre <span className="text-white">chien médiateur</span>, notre <span className="text-white">infirmière</span> et notre <span className="text-white">psychologue scolaire</span>.
            </p>
          </div>
          <div className="bg-[#18aae2] rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-4xl">🌎</span>
              <h3 className="text-2xl font-black uppercase italic mt-4 leading-none">Stand Ouverture <br/>Internationale</h3>
            </div>
            <ul className="text-[15px] font-bold space-y-1 uppercase tracking-tighter opacity-90">  
              <li>• Option Bi-langue dès la 6ème</li>
              <li>• Section Européenne</li>
              <li>• Cambridge First</li>
              <li>• Dual Diploma USA</li>
            </ul>
          </div>
          <div className="bg-[#fbb800] rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-lg">
             <div>
              <span className="text-4xl">🏀</span>
              <h3 className="text-2xl font-black uppercase italic mt-4">Stand Sports</h3>
            </div>
            <p className="text-[15px] font-bold leading-tight uppercase">Partenariats :<br/><br/> Basket (BMFB)<br/>Foot (USMEF)<br/> Équitation (ALISA)</p>
          </div>
        </div>
        <section className="mt-8 flex items-center justify-between pt-8 text-gray-900 z-10">
          <div className="flex flex-col gap-1">
            <p className="text-xl font-black italic">Le Mesnil-Esnard</p>
            <p className="text-sm font-bold opacity-60 uppercase">6, rue de Neuvillette</p>
            <p className="text-[10px] font-black bg-gray-100 px-2 py-1 rounded w-fit mt-2">ÉCOLE • COLLÈGE • LYCÉE</p>
          </div>
          <Image  src={Logo}  alt="Logo La Providence" width={150} height={150} className="z-10 relative pr-2" priority/>
          <div className="bg-slate-900 p-5 rounded-[2rem] flex items-center gap-6 text-white shadow-xl">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#fbb800]">Inscription</p>
              <p className="text-xs font-bold italic leading-tight">Flashez pour <br/>réserver</p>
            </div>
            <div className="bg-white p-2 rounded-xl">
               <Image src={QRCode} width={100} height={100} alt="QR Code" priority />
            </div>
          </div>
        </section>
      </section>
    </section>
  );
}
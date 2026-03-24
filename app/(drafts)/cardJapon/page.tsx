import React from 'react';
import Image from 'next/image';
import PigeonnierPagode from "../../../public/PigeonnierPagode.jpg";
import NicolasBarreSan from "../../../public/NicolasBarreSan.jpg"
import GrandTori from "../../../public/GrandTori.jpg"

const cardsData = [
  { id: 1, name: "Le Pigeonnier Pagode", rarity: "Legendary", power: 5000, type: "Monument", img: PigeonnierPagode },
  { id: 2, name: "Le Grand Torii Nicolas Barré", rarity: "Rare", power: 2500, type: "Passage", img: GrandTori },
  { id: 3, name: "Sensei Nicolas Barré", rarity: "Legendary", power: 9999, type: "Héros", img: NicolasBarreSan },
  { id: 4, name: "La Cour des Cerisiers", rarity: "Common", power: 1200, type: "Lieu", img: PigeonnierPagode },
  { id: 5, name: "Le Réfectoire Izakaya", rarity: "Common", power: 1100, type: "Vitalité", img: PigeonnierPagode },
  { id: 6, name: "Shinkansen Providence", rarity: "Rare", power: 3000, type: "Vitesse", img: PigeonnierPagode },
  { id: 7, name: "Le Dojo de Sport", rarity: "Common", power: 1500, type: "Force", img: PigeonnierPagode },
  { id: 8, name: "Bibliothèque de Kyoto", rarity: "Rare", power: 2800, type: "Savoir", img: PigeonnierPagode },
  { id: 9, name: "Sceau Impérial Providence", rarity: "Legendary", power: 8888, type: "Elite", img: PigeonnierPagode },
];

export default function PlancheCartesJapon() {
  return (
      <div className="bg-white p-[10mm] shadow-2xl w-[210mm] h-[297mm] grid grid-cols-3 grid-rows-3 gap-2 border border-gray-300">
        {cardsData.map((card) => (
          <div key={card.id} className="border-2 border-black rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start border-b-2 border-black pb-1">
              <span className="text-[10px] font-black uppercase tracking-tighter italic">#{card.id.toString().padStart(3, '0')}</span>
              <h3 className="text-[12px] font-black uppercase tracking-tight leading-none text-right w-2/3">{card.name}</h3>
            </div>
            <div className="flex-grow my-2 border-2 border-black/20 rounded flex items-center justify-center bg-gray-50 overflow-hidden relative">
                <Image src={card.img}  alt={card.name} fill style={{ objectPosition: 'center 20%' }} className="object-cover" unoptimized/>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center bg-black text-white px-2 py-0.5 rounded-sm">
                <span className="text-[8px] font-bold uppercase italic">Power Level</span>
                <span className="text-[10px] font-black italic">{card.power} XP</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[8px] font-bold uppercase">
                <div className="border border-black px-1 py-0.5 text-center">{card.type}</div>
                <div className="border border-black px-1 py-0.5 text-center italic">{card.rarity}</div>
              </div>
            </div>
            <div className="mt-2 opacity-30 flex justify-center">
               <span className="text-[8px] font-black">PROVIDENCE JAPON 2027</span>
            </div>
          </div>
        ))}
      </div>
  );
}
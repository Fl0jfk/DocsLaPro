"use client"

import Image from "next/image";
import logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";
import { useState, useEffect } from "react";

export default function TransportRequestPage() {
    const [classe, setClasse] = useState("");
    const [date, setDate] = useState(""); 
    const [dateLimite, setDateLimite] = useState("");
    const [lieu, setLieu] = useState(""); // Nouvel état pour le lieu de la sortie
    
    const calculerDateLimite = (dateSortie: string | number | Date) => {
        const dateSortieObj = new Date(dateSortie);
        dateSortieObj.setDate(dateSortieObj.getDate() - 7);
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long'
        };
        const dateLimiteeFormatee = new Intl.DateTimeFormat('fr-FR', options).format(dateSortieObj);
        setDateLimite(dateLimiteeFormatee);
    };
    
    useEffect(() => {
        if (date) {
            calculerDateLimite(date);
        }
    }, [date]);

    return (
        <main className="p-4 w-full flex flex-col gap-3 items-center justify-center text-lg">
            <header className="flex gap-16 items-center justify-center">
                <Image src={logo} alt="Logo La Providence" width={110} height={110} />
                <h1 className="text-4xl font-bold">La Providence Nicolas Barré</h1>
            </header> 
            <div className="border p-6 w-full rounded-xl border-black flex flex-col items-center justify-center gap-4 shadow-lg">
                <h2 className="text-5xl">Autorisation de sortie</h2>
                <h3 className="text-4xl">Repas de classe</h3>
            </div>
            <div className="mb-4 flex text-nowrap gap-4 items-center mt-4">
                <label className="block font-bold" htmlFor="date">À remettre au secrétariat avant le : {dateLimite}</label>
            </div>
            <div className="mb-4 flex text-nowrap gap-4 items-center mt-4">
                <label className="block font-bold" htmlFor="nom">Je soussigné(e) M. et/ou Mme :</label>
                <input type="text" id="nom" className="p-2 border-b border-black w-full" />
            </div>
            <div className="mb-4 flex text-nowrap gap-4 items-center mt-4">
                <label className="block font-bold" htmlFor="eleve">Parents de l&apos;élève :</label>
                <input type="text" id="eleve" className="p-2 border-b border-black w-full"/>
            </div>
            <div className="mb-4 flex text-nowrap gap-4 items-center mt-4">
                <label className="block font-bold" htmlFor="classe">En classe de :</label>
                <input type="text" id="classe" className="p-2 border rounded w-full" placeholder="Classe de l'élève" value={classe} onChange={(e) => setClasse(e.target.value)} />
            </div>
            {classe&&<p className="text-lg w-[80%]">Autorise mon enfant à participer à une sortie, organisée par les élèves et leurs professeurs de {classe},</p>}
            <div className="flex text-nowrap gap-1 items-center ">
                <p>le :</p>
                <input  type="date"  id="date"  className="w-full text-center"  value={date}  onChange={(e) => setDate(e.target.value)} />
                <p> à :</p>
                <select  id="lieu"  className="p-2 border rounded" value={lieu}  onChange={(e) => setLieu(e.target.value)}>
                    <option value="">Choisir un lieu</option>
                    <option value="McDonald's Laser Game">McDonald&apos;s + Laser Game de Rouen</option>
                    <option value="Pique Nique Laser Game">Pique-Nique + Laser Game de Rouen</option>
                    <option value="McDo Cinéma">McDonald&apos;s + Cinéma de Rouen</option>
                     <option value="Nachos Cinéma">Nachos + Cinéma de Rouen</option>
                    <option value="McDo Bowling">McDonald&apos;s + Bowling</option>
                    <option value="Restaurant La Pasta Tinto">Restaurant La Pasta Tinto</option>
                    <option value="Bowling Amfreville La Mi-Voie">Bowling Amfreville La Mi-Voie</option>
                    <option value="Domicile de Mr FAUCHEUX">Domicile de Mr FAUCHEUX</option>
                    <option value="Domicile de Mme BALESTA">Domicile de Mme BALESTA</option>
                </select>  
            </div>
            <div className="w-[74%]">
                <p>Les élèves pensionnaires se rendront à la sortie accompagnés de :</p>
                <input type="text" id="accompagnant" className="p-2 border-b border-black w-full" placeholder="Nom de l'accompagnant" />
                <p>Puis seront raccompagnés à la Providence par :</p>
                <input type="text" id="accompagnantRetour" className="p-2 border-b border-black w-full" placeholder="Nom de l'accompagnant" />
            </div>
            <div className="flex justify-between w-[80%] mt-4">
                <div>
                    <p>Signature du ou des parents</p>
                </div>
                <div>
                    <p>Madame Dona</p>
                    <p>Directrice du lycée</p>
                </div>
            </div>
        </main>
    );
}





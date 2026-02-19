"use client"

import Image from "next/image";
import logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";
import { useState } from "react";

export default function TransportRequestPage() {
    const today = new Date().toLocaleDateString('fr-FR');
    const [selectedOption, setSelectedOption] = useState("demande");
    const [tarif, setTarif] = useState("");
    const transporters = ["TRANSPORTS PERIER (stephanie.fouin@cars-perier.fr)","TRANSPORTS REFLEXE (contact.autocars@reflexe-voyages.com)","TRANSPORTS HANGARD (carole@hangard-autocars.com)","TRANSPORTS AUZOUX (contact@auzouxvoyages.fr)", "CARS DENIS (contact@carsdenis.com)"];
    return (
        <section className="p-4 w-full">
            <section className="flex gap-16 items-center justify-center">
                <Image src={logo} alt="Logo La Providence" width={110} height={110} />
                <h1 className="text-4xl font-bold">La Providence Nicolas Barré</h1>
            </section>
            <section className="mt-2 flex flex-col gap-4 items-center w-full mx-auto justify-center">
                <div className="mb-4 w-full text-xl">
                    <h2 className="text-2xl font-bold underline mb-4">Informations :</h2>
                    <div className="flex gap-2">
                        <p>6 rue de Neuvillette</p>
                        <p>76240 LE MESNIL ESNARD</p>
                    </div>
                    <p>☎ 02 32 86 50 90</p>
                    <div className="flex gap-4 text-nowrap items-center">
                        <label htmlFor="prof">Professeur qui a fait la demande :</label>
                        <input type="text" id="prof" className="p-1 border rounded w-full" placeholder="Nom du prof" />
                    </div>
                </div>
                <div className="mb-4 w-full flex gap-2">
                    <h2 className="text-2xl font-bold underline">Destinataire :</h2>
                    <select className="p-2 border rounded">
                        {transporters.map((transporter, index) => (
                            <option key={index} value={transporter}>{transporter}</option>
                        ))}
                    </select>
                </div>
                <div className="mb-4 w-full flex items-center gap-2 text-2xl font-bold ">
                    <h2 className="underline">Date de l&apos;envoi :</h2>
                    <p>{today}</p>
                </div>
                <div className="mb-4 w-full flex gap-2 items-center">
                <h2 className="text-2xl font-bold underline">Objet :</h2>
                <select className="p-2 border rounded" value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
                    <option value="demande">Demande de devis</option>
                    <option value="confirmation">Confirmation de devis</option>
                </select>
                <input type="text" className="p-2 border rounded" placeholder="Numéro de devis"/>
                {selectedOption === "confirmation" && (    
                    <div className="flex items-center ">
                          <input type="text" className="p-2 border rounded text-right w-[100px]" placeholder="Tarif" value={tarif} onChange={(e) => setTarif(e.target.value)}/>
                          <p>€</p>  
                    </div>  
                )}
                </div>
                <div className="mb-4 w-full">
                    <h2 className="text-2xl font-bold underline mb-4">Détails :</h2>
                    <div className="mb-4 flex text-nowrap gap-4 items-center mt-4">
                        <label className="block font-bold" htmlFor="address">Adresse :</label>
                        <input type="text" id="address" className="p-2 border rounded w-full" placeholder="Adresse du lieu" />
                    </div>
                    <div className="mb-4 flex text-nowrap gap-4 items-center mt-4">
                        <label className="block font-bold" htmlFor="dates">Dates :</label>
                        <input type="text" id="dates" className="p-2 border rounded w-full" placeholder="Ex : Du lundi 19 mai 2025 au vendredi 23 mai 2025" />
                    </div>
                    <div className="mb-4 flex text-nowrap gap-4 items-center mt-4">
                        <label className="block font-bold" htmlFor="people">Nombre de personnes :</label>
                        <input type="number" id="people" className="p-2 border rounded w-full" placeholder="Nombre de personnes" />
                    </div>
                    <div className="mb-4 flex text-nowrap gap-4 items-center mt-4">
                        <label className="block font-bold" htmlFor="departure">Départ :</label>
                        <input type="text" id="departure" className="p-2 border rounded w-full" placeholder="Ex : Providence Église Jean Bosco, nuit du dimanche au lundi à 00h00" />
                    </div>
                    <div className="mb-4 flex text-nowrap gap-4 items-center mt-4">
                        <label className="block font-bold" htmlFor="return">Retour :</label>
                        <input type="text" id="return" className="p-2 border rounded w-full" placeholder="Ex : Providence Église Jean Bosco à 23h00" />
                    </div>
                    <div className="mb-4">
                        <label className="block font-bold mb-1" htmlFor="other-details">Autres détails :</label>
                        <textarea id="other-details" style={{ height: '140px' }} className="p-2 border rounded w-full" placeholder="Autres informations ou besoins spécifiques"></textarea>
                    </div>
                </div>
            </section>
        </section>
    );
}

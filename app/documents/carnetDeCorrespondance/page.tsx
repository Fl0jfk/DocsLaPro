"use client";

import Image from "next/image";
import logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";
import image from "../../../public/College-La-Pro-pjaconwt6bka4szj7rammo70l9o4o2vek5rh8xn160.png";
import nico from "../../../public/nico.png";

export default function CarnetDeCorrespondance() {
    return (
        <main className="relative w-full flex flex-col gap-3 items-center justify-center h-screen max-w-[800px] mx-auto border border-black overflow-hidden text-white bg-gradient-to-t from-[#5e9bf6] to-[#cce4ff]">
            <Image src={image} alt="Fond de l'établissement" fill className="object-contain object-bottom mt-28"/>
            <div className="relative z-10 backdrop-blur-[1px] p-10 rounded flex flex-col h-full w-full items-center gap-10">
                <h1 className="text-3xl font-bold">Carnet de Correspondance</h1>
                <div className="flex items-center justify-between mx-auto w-4/5">
                    <div className="w-1/4">
                        <Image src={logo} alt="Logo de l'établissement" className="w-full h-auto mb-4" />
                    </div>
                    <div className="flex flex-col text-6xl">
                        <h2>Collège</h2>
                        <h2>La Providence</h2>
                        <h2>Nicolas Barré</h2>
                    </div>
                </div>
                <p className="text-3xl">Année scolaire 2025 / 2026</p>
                <div className="flex flex-col gap-2 text-2xl">
                    <p>Nom de l'élève : ___________________________________</p>
                    <p>Prénom de l'élève : ________________________________</p>
                    <p>Classe : _________________________________________</p>
                    <p>Adresse : ________________________________________</p>
                </div>
                <div className="flex flex-col text-xl mt-[-10px]">
                    <p>6, rue de Neuvillette - BP 28 - 76240 LE MESNIL-ESNARD</p>
                    <div className="flex gap-16">
                        <p>Tél. 02 32 86 50 90</p>
                        <p>e-mail : 0762565a@ac-rouen.fr</p>
                    </div>
                    <p>site : https://laprovidence-nicolasbarre.fr/</p>
                </div>
                <div className="flex flex-col mt-[210px] text-outline-black font-bold">
                    <p>Le carnet de liaison est un lien permanent entre le collège et la famille.</p>
                    <p>L'élève doit l'avoir constamment sur lui.</p>
                    <p>Il porte tout changement d'horaire, toute notification des absences et des retards.</p>
                    <p>Les parents doivent le consulter chaque jour et signer toute communication faite soit par eux, soit par le collège.</p>
                </div>
                <div className="flex mt-[-55px] mx-auto">
                    <Image src={nico} width={80} height={80} alt="nico"/>
                </div>
            </div>
        </main>
    );
}



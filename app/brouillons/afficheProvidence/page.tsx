"use client"

import Image from "next/image";

export default function AfficheProvidence() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-[#cfcfd8]">
      <section className="relative w-[210mm] h-[297mm] bg-white overflow-hidden shadow-2xl">
        <div className="absolute top-[480px] left-[-120px] w-[200px] h-[200px] rounded-full bg-white border-[40px] border-[#e94f8a] shadow-[0_10px_25px_rgba(0,0,0,0.12)]"/>
        <div className="absolute top-[120px] left-[-65px] w-[600px] h-[600px] rounded-full bg-[#fbb800] shadow-[0_10px_25px_rgba(0,0,0,0.12)]" />
        <div className="absolute top-[-250px] left-[-200px] w-[300px] h-[300px] rounded-full bg-white border-[#18aae2] border-[60px]" />
        <div className="absolute top-[-150px] right-[-120px] w-[300px] h-[300px] rounded-full bg-white border-[#18aae2] border-[60px]" />
        <div className="absolute top-[400px] right-[180px] w-[300px] h-[300px] rounded-full bg-[#e94f8a] " />
        <header className="relative z-10 flex justify-between items-start p-10">
          <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" alt="Logo" width={110} height={110}/>
        </header>
        <section className="relative z-10 mt-10 ml-10 max-w-md">
          <h2 className="text-5xl font-extrabold leading-tight text-white italic">Portes ouvertes</h2>
          <p className="text-pink-500 text-5xl font-extrabold leading-tigh italic">De la maternelle au lycée</p>
          <p className="mt-6 text-lg text-white w-[60%]">Venez découvrir nos établissements, rencontrer l’équipe éducative et visiter nos locaux.</p>
        </section>
        <section className="absolute top-40 right-20 flex flex-col gap-6 z-10">
          <p>photos</p>
        </section>
        <section className="absolute top-[520px] left-[420px]">
          <p>qr code</p>
        </section>
        <section className="absolute top-[800px] w-full flex justify-center items-center gap-8 z-10">
          <div className="rounded-full h-[200px] w-[200px] bg-[#fbb800] flex flex-col items-center justify-center text-white">
            <h3 className="font-bold">Ecole</h3>
            <p>Bienveillance<br />Curiosité<br />Bases solides</p>
          </div>
          <div className="rounded-full h-[200px] w-[200px] bg-[#18aae2] flex flex-col items-center justify-center text-white">
            <h3 className="font-bold">Collège</h3>
            <p>Méthode<br />Accompagnement<br />Confiance</p>
          </div>
          <div className="rounded-full h-[200px] w-[200px] bg-[#e3097b] flex flex-col items-center justify-center text-white">
            <h3 className="font-bold">Lycée</h3>
            <p>Orientation<br />Exigence<br />Réussite</p>
          </div>
        </section>
      </section>
    </main>
  );
}
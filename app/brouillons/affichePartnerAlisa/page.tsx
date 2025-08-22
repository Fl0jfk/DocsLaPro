import Image from 'next/image';

export default function PortesOuvertesAlisa() {
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <Image src="/chevaux.jpg" alt="Centre équestre" fill className="object-cover"/>
      <div className="absolute top-4 left-4 z-10">
        <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" alt="Logo La Providence" width={120} height={60}/>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <Image src="/logo alisa.png" alt="Logo Alisa" width={160} height={80}/>
      </div>
      <div className="flex flex-col items-center justify-center text-center space-y-6 z-10 px-4">
        <div className="absolute top-[200px] bg-pink-600 text-white text-6xl font-extrabold px-6 py-3 rounded rotate-[-5deg] shadow-lg uppercase">Portes ouvertes</div>
        <div className="absolute top-[300px] bg-yellow-300 text-black text-4xl font-bold px-6 py-3 rounded rotate-[2deg] shadow-md">Samedi 29 juin · 9h30 – 11h30</div>
        <div className="absolute top-[830px] bg-green-300 text-black text-4xl font-bold px-6 py-3 rounded rotate-[2deg] shadow-md">L’équitation, une école de la vie !</div>
        <div className="absolute top-[900px] bg-blue-300 text-black text-4xl font-bold px-6 py-3 rounded rotate-[-2deg] shadow-md">Nature, respect, dépassement de soi</div>
        <p className="absolute top-[1000px] bg-white/60 text-gray-900 text-lg max-w-2xl px-6 py-4 rounded-lg shadow-md"> Venez découvrir le partenariat entre le groupe scolaire <strong>La Providence</strong> et le centre équestre <strong>ALISA</strong> à l’occasion d’une matinée conviviale !</p>
      </div>
    </main>
  );
}



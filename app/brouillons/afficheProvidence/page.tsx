import Image from 'next/image';

export default function AfficheProvidence() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[rgba(207, 207, 216, 1)]">
      <Image src="/Plan_La_Pro.png" alt="Plan" fill className="object-cover"/>
      <div className="absolute top-4 left-4 z-10">
        <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" alt="Logo La Providence" width={120} height={60}/>
      </div>
      <div className="flex flex-col items-center justify-center text-center space-y-6 z-10 px-4">
        
      </div>
    </main>
  );
}


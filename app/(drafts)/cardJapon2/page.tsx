import Image from 'next/image';
import LogoJapon from "../../../public/Logo_La_Providence_JAPON no background.png";
import QRcode from "../../../public/qr_code_japon.png"

export default function PlancheVerso() {
  return (
      <div className="bg-white p-[10mm] shadow-2xl w-[210mm] h-[297mm] grid grid-cols-3 grid-rows-3 gap-2 border border-gray-300">
      {[...Array(9)].map((_, i) => (
        <div 
          key={i} 
          className="border-2 border-black rounded-xl p-4 flex flex-col items-center justify-between bg-white text-black relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
          </div>
          <div className="relative z-10 w-full text-center border-b border-white/30">
            <p className="text-[8px] font-black tracking-[0.4em] uppercase">
               LA PROVIDENCE <br/> NICOLAS BARRÉ
            </p>
          </div>
          <div className="relative z-10 w-32 h-32 flex items-center justify-center">
            <Image 
              unoptimized
              src={LogoJapon} 
              alt="Logo Providence Japon" 
              className="object-contain"
              width={500}
              height={500}
            />
          </div>
          <div className="relative z-10 w-full flex flex-col items-center gap-2">
            <div className="w-22 h-22 bg-white rounded-sm shadow-inner flex items-center justify-center">
              <Image src={QRcode} width={300} height={300} alt='' unoptimized/>
            </div>
            <div className="text-center">
              <p className="text-[7px] font-black uppercase tracking-widest italic">JAPON 2027</p>
              <p className="text-[5px] opacity-60 uppercase font-medium">Carte de collection officielle - Ne peut être vendue</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-1 opacity-40">
              <div className="border-t border-r border-white w-4 h-4"></div>
          </div>
          <div className="absolute bottom-0 left-0 p-1 opacity-40">
              <div className="border-b border-l border-white w-4 h-4"></div>
          </div>
        </div>
      ))}

    </div>    
  );
}
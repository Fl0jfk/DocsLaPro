import QrCode from "../../../public/qr_codepreinscription.png";
import QrCodeTarifs from "../../../public/QR Code Simulateur Tarifs.png";
import Logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";
import Image from "next/image";

export default function FlyersPreinscription() {
  const flyers = Array.from({ length: 4 });
  return (
    <div className="bg-white min-h-screen p-4 mt-6">
      <div className="grid grid-cols-2 gap-4 max-w-[21cm] mx-auto mb-20">
        {flyers.map((_, index) => (
          <div key={index} className="border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-between h-[13.5cm] rounded-xl bg-white shadow-sm relative overflow-hidden" style={{ breakInside: 'avoid' }}>
            <div className="z-10 h-28 relative w-full flex justify-center">
              <Image src={Logo} alt="Logo La Providence" className="object-contain h-full w-auto"/>
            </div>
            <div className="text-center z-10">
              <div className="inline-block bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                <p className="text-blue-900 font-black text-2xl uppercase tracking-tight">Pré-inscription</p>
              </div>
            </div>
            <div className="w-44 h-44 bg-white rounded-2xl border-4 border-slate-50 shadow-xl flex items-center justify-center relative z-10">
                <Image src={QrCode} alt="QR Code" className="w-36 h-36"/>
                <div className="absolute -bottom-3 bg-blue-600 px-4 py-1 rounded-full shadow-lg text-[10px] font-bold text-white uppercase tracking-wider">Scannez ici</div>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">La Providence Nicolas Barré</p>
            </div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full z-0 opacity-40"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-50 rounded-full z-0 opacity-40"></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-[21cm] mx-auto pt-10">
        {flyers.map((_, index) => (
          <div key={index} className="border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-between h-[13.5cm] rounded-xl bg-white shadow-sm relative overflow-hidden" style={{ breakInside: 'avoid' }}>
            <div className="z-10 h-28 relative w-full flex justify-center">
              <Image src={Logo} alt="Logo La Providence" className="object-contain h-full w-auto"/>
            </div>
            <div className="text-center z-10">
              <div className="inline-block bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                <p className="text-slate-800 font-black text-2xl uppercase tracking-tight">Simulateur Tarifs</p>
              </div>
            </div>
            <div className="w-44 h-44 bg-white rounded-2xl border-4 border-slate-50 shadow-xl flex items-center justify-center relative z-10">
                <Image src={QrCodeTarifs} alt="QR Code" className="w-36 h-36"/>
                <div className="absolute -bottom-3 bg-slate-800 px-4 py-1 rounded-full shadow-lg text-[10px] font-bold text-white uppercase tracking-wider">Voir les tarifs</div>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">https://laprovidence-nicolasbarre.fr</p>
            </div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full z-0 opacity-40"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-slate-50 rounded-full z-0 opacity-40"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
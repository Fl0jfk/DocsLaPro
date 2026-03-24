import Link from "next/link";
import Image from "next/image";
import Logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";

type Active = "ecole" | "college" | "lycee" | undefined;

export default function SiteHeader({ active }: { active?: Active }) {
  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between text-sm font-medium text-slate-600">
        <Link href="/" className="hover:opacity-80 transition">
          <div className="w-[60px] h-[60px] flex-shrink-0">
            <Image src={Logo} alt="La Providence Nicolas Barré" width={150} height={150} quality={100}/>
          </div>
        </Link>
        <nav className="hidden md:flex gap-8">
          <Link href="/ecole"   className={`hover:text-yellow-600 transition-colors ${active === "ecole"   ? "text-yellow-600 font-bold" : ""}`}>École</Link>
          <Link href="/college" className={`hover:text-blue-500  transition-colors ${active === "college" ? "text-blue-500 font-bold"  : ""}`}>Collège</Link>
          <Link href="/lycee"   className={`hover:text-pink-600  transition-colors ${active === "lycee"   ? "text-pink-600 font-bold"  : ""}`}>Lycée</Link>
        </nav>
        <div className="flex gap-2 items-center">
          <Link href="/portesouvertes" className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-700 transition-all">
            Pré-inscription
          </Link>
          <Link href="/dashboard" className="flex items-center justify-center bg-slate-100 text-slate-600 w-9 h-9 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}

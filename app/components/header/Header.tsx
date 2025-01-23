"use client"

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
    const pathname = usePathname();
    const Logo = "https://docslapro.s3.eu-west-3.amazonaws.com/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";
    const isHidden = pathname === "/documents/devisTransport" || pathname === "/documents/autorisationSortie";	
    return (
        <header className={`w-full max-w-[1000px] mx-auto ${isHidden ? "hidden" : ""}`}>
            <Link href={"/"} className="flex justify-between items-center">
                <Image src={Logo} alt="Logo" width={150} height={150} />
                <h1 className="text-3xl">Bienvenue sur les Docs de La Providence</h1>
            </Link>
        </header>
    );
}

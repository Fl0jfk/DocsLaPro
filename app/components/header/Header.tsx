import Image from "next/image"
import Link from "next/link"

export default function Header (){
    const Logo = "https://docslapro.s3.eu-west-3.amazonaws.com/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";
    return (
        <header className="w-1/2 mx-auto">
            <Link href={"/"} className="flex gap-52 items-center">
                <Image src={Logo} alt="Logo" width={150} height={150} />
                <h1 className="text-4xl">Bienvenue sur les Docs de La Providence</h1>
            </Link>
        </header>
    )
}
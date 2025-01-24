import { usePathname } from 'next/navigation';


export default function Footer (){
    const pathname = usePathname();
    if (pathname === "/documents/portesOuvertesSVG" || pathname === "/documents/devisTransport") {
        return null;
    }
    return(
        <footer className="w-full h-full p-2 flex flex-col gap-4 max-w-[1200px] mx-auto">
            <p>Footer</p>
        </footer>
    )
}
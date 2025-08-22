import { useState, useEffect } from 'react';
import Image from 'next/image';
import CrossButton from '../Buttons/CrossButton';
import Navbar from '../Navbar/Navbar';
import { SignedIn, UserButton, SignOutButton} from '@clerk/nextjs';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';	
import Logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
    const { scrollY } = useScroll();
    const pathname = usePathname();
    const [menuOpened, setMenuOpened] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    useEffect(() => {
        if (isClient && (pathname === "/documents/affichePartnerAlisa" || pathname === "/documents/carnetDeCorrespondance/organigramme" || pathname === "/documents/carnetDeCorrespondance" || pathname === "/documents/ficheInscriptionTerminaleGenerale" || pathname === "/documents/portesOuvertesSVG" || pathname === "/documents/devisTransport" || pathname === "/documents/autorisationSortie" || pathname === "/documents/cartePoliceMesnil")) {
            setHidden(true);
        }
    }, [isClient, pathname]);
    const opacityMenu = !menuOpened ? "opacity-95 h-[10vh] ease-linear duration-300" : "h-[100vh] ease-linear duration-300";
    const opacityLogo = !menuOpened ? "ease-linear delay-100 duration-200 scale-1" : "ease-linear delay-150 duration-300 scale-0";
    const handleClick = () => { setMenuOpened(!menuOpened);};
    useMotionValueEvent(scrollY, "change", (latest: number) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });
    const handleLinkClick: OnLinkClick = ({ clickOnLink }) => { setMenuOpened(clickOnLink)};
    if (isClient && (pathname === "/documents/affichePartnerAlisa" || pathname === "/documents/carnetDeCorrespondance/organigramme" || pathname === "/documents/carnetDeCorrespondance" || pathname === "/documents/ficheInscriptionTerminaleGenerale" || pathname === "/documents/portesOuvertesSVG" || pathname === "/documents/devisTransport" || pathname === "/documents/autorisationSortie" || pathname === "/documents/cartePoliceMesnil")) {
        return null;
    }
    return (
        <motion.header  variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}  animate={hidden ? "hidden" : "visible"}  transition={{ duration: 0.35, ease: "easeInOut" }} className={`flex p-4 justify-between items-center w-fullfixed z-[12] md:mb-[100px] ${opacityMenu} self-center text-2xl overflow-hidden bg-[#fff]`}>
            <div className="flex items-center h-full w-4/12">
                {Logo && (
                    <Link href="/">
                        <Image src={Logo} alt="Mon memoji" style={{width:"auto"}} width={55} height={55} className={`object-cover cursor-pointer z-[8] ${opacityLogo}`} quality={100}  onClick={() => { window.scrollTo({ top: 0, left: 0, behavior: "smooth" }); }}/>
                    </Link>
                )}
            </div>
            <div className="w-8/12 gap-4 flex justify-end items-center sm:mt-[-5px] h-full">
             <div className="flex gap-4">
              <SignedIn>
                <UserButton/>
                <SignOutButton>
                  <button className="px-2 py-2">Se déconnecter</button>
                </SignOutButton>
              </SignedIn>
            </div>
                <Navbar menuOpened={menuOpened} onLinkClick={handleLinkClick} />    
                <div className="flex justify-end w-[40] items-center h-full" onClick={handleClick}>
                    <CrossButton menuOpened={menuOpened} />
                </div>
            </div>
        </motion.header>
    );
}

type OnLinkClick = (data: { clickOnLink: boolean }) => void;
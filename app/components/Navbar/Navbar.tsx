"use client"

import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";

export default function Navbar({menuOpened, onLinkClick} :NavbarProps ){
    const [clickOnLink, setClickOnLink] = useState(menuOpened);
    const menuOpen = (clickOnLink ? "bg-white" : "hidden");
    const [servicesAppear, setServicesAppear] = useState(false);
    const servicesVisible = (servicesAppear ? "" : "hidden");
    const restOfMenu = (!servicesAppear ? "" : "hidden");  
    const handleLinkClick = () => {
        setClickOnLink(false);
        onLinkClick({ clickOnLink: false });
        setServicesAppear(false);
    };
    useEffect(() => {
        setClickOnLink(menuOpened)
        if(menuOpened){
            document.body.classList.add('overflow-hidden');
            setServicesAppear(false);
        } else {
            document.body.classList.remove('overflow-hidden');
        }
    }, [menuOpened])
    return (
        <>
            <AnimatePresence>
                {menuOpened && 
                    <motion.nav  className={`${menuOpen} gap-6 text-2xl flex flex-col justify-center top-0 left-0 fixed items-center w-full h-[100vh] z-[9]`} initial={{translateX:"100%"}} animate={{translateX:"0%", transition:{duration: 0.5, ease: "easeInOut"}}} exit={{translateX:"100%", transition:{duration: 0.5, ease: "easeInOut"}}}>
                        <div className='w-2/12 h-[10vh] flex items-center justify-center w-full'>
                            {Logo && 
                                <Link className='hover:scale-110 flex items-center justify-center' href="/" onClick={handleLinkClick} aria-label="Link to top">
                                    <Image src={Logo} alt='Logo de LittleQueenPhotography' width={100} height={100} quality={100} className='cursor-pointer z-[8]'/>
                                </Link>
                            }
                        </div>
                        <div className={`flex flex-col gap-6 justify-center items-center w-full ${restOfMenu}`}>
                            <Link href="/" onClick={handleLinkClick} aria-label="Lien vers la page d'accueil">Accueil</Link>
                            <Link href="https://laprovidence-nicolasbarre.fr" onClick={handleLinkClick} aria-label="Lien vers le site La Providence Nicolas Barré">Lien vers le site web</Link>
                        </div>
                        <div  className={`flex flex-col gap-4 justify-center items-center w-full ${servicesVisible}`}>
                            <svg width="40px" height="40px" viewBox="0 0 24 24" fill="none" className='cursor-pointer absolute top-4 left-4' onClick={()=>setServicesAppear(false)}>
                                <path d="M11 6L5 12M5 12L11 18M5 12H19" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>                     
                        </div>
                    </motion.nav>
                }
            </AnimatePresence>
        </>
    )
}

type NavbarProps = {
    menuOpened: boolean;
    onLinkClick: OnLinkClick;
}

type OnLinkClick = (data: { clickOnLink: boolean }) => void;

'use client';

import { useState, useEffect } from 'react';
import { SignedIn, UserButton, SignOutButton } from '@clerk/nextjs';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'; 
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HomeSVG = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const LogOutSVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>);

export default function Header() {
  const pathname = usePathname(); 
  const { scrollY } = useScroll();
  const [menuOpened, setMenuOpened] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  useMotionValueEvent(scrollY, "change", (latest: number) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 100) {
      setHidden(true);
      setMenuOpened(false);
    } else {
      setHidden(false);
    }
  });
  const excludedPrefixes = ['/brouillon','/portesouvertes','/simulateurTarifs'];
  const isExcluded = excludedPrefixes.some(prefix => pathname?.startsWith(prefix));
  if (isExcluded) return null;
  if (!isClient) return null;
  return (
    <motion.header variants={{ visible: { y: 0 }, hidden: { y: -120 } }} animate={hidden ? "hidden" : "visible"} transition={{ duration: 0.2 }} className="fixed top-6 right-6 z-[100] max-w-[1500px] mx-auto">
      <motion.div  animate={{ width: menuOpened ? 190 : 56 }} transition={{ type: "spring", stiffness: 500, damping: 40 }} className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl h-[56px] rounded-full overflow-hidden flex items-center justify-end">
        <div className="flex items-center w-full h-full relative max-w-[1500px] mx-auto">
          <AnimatePresence>
            {menuOpened && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="absolute left-4 flex items-center gap-4">
                <Link href="/" onClick={() => setMenuOpened(false)} className="active:scale-90 transition-transform">
                  <HomeSVG />
                </Link>
                <div className="w-[1px] h-4 bg-black/10" />
                <SignedIn>
                  <div className="scale-90 shrink-0">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                  <SignOutButton>
                    <button className="active:scale-90 transition-transform pt-0.5">
                      <LogOutSVG />
                    </button>
                  </SignOutButton>
                </SignedIn>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setMenuOpened(!menuOpened)}className="absolute right-1 w-[48px] h-[48px] flex flex-col items-center justify-center gap-[4px] rounded-full active:bg-black/5 transition-colors">
            <motion.span animate={{ rotate: menuOpened ? 45 : 0, y: menuOpened ? 6 : 0 }} className="w-5 h-[2px] bg-black rounded-full block origin-center"/>
            <motion.span  animate={{ opacity: menuOpened ? 0 : 1 }} className="w-5 h-[2px] bg-black rounded-full block"/>
            <motion.span  animate={{ rotate: menuOpened ? -45 : 0, y: menuOpened ? -6 : 0 }} className="w-5 h-[2px] bg-black rounded-full block origin-center"/>
          </button>
        </div>
      </motion.div>
    </motion.header>
  );
}
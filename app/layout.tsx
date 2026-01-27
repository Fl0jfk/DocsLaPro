'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Header from './components/HeaderF/Header';
import { DataProvider } from './contexts/data';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const metaDetails: Record<string, { title: string; description: string }> = {
    '/': {
      title: "Bienvenue dans l'intranet de La Providence Nicolas Barré",
      description: 'Un intranet moderne pour connecter vos équipes.',
    },
  };
  const { title, description } = metaDetails[pathname] || {};
  useEffect(() => {
    if (title) document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description || '');
    } else if (description) {
      const newMetaDescription = document.createElement('meta');
      newMetaDescription.name = 'description';
      newMetaDescription.content = description;
      document.head.appendChild(newMetaDescription);
    }
  }, [pathname, title, description]);

  return (
    <ClerkProvider>
      <html lang="fr">
        <body className="antialiased text-black font-medium max-w-[1500px] mx-auto bg-[#f0f2f5] relative min-h-screen">
          <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#fbb800]/10 rounded-full blur-[120px] pointer-events-none z-[-1]"></div>
          <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#e94f8a]/10 rounded-full blur-[120px] pointer-events-none z-[-1]"></div>
          <DataProvider>
            <Header />
            {children}
          </DataProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
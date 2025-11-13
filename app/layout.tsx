'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Header from './components/HeaderF/Header';
import Footer from './components/Footer/Footer';
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
        <body className="antialiased text-black font-medium mx-auto bg-[rgb(245,245,247)]">
          <DataProvider>
            <Header />
            {children}
            <Footer />
          </DataProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}


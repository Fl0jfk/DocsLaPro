"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Head from 'next/head';
import { DataProvider } from './contexts/data';

const metaDetails: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Bienvenue chez dans lintranet La Providence',
    description: 'Un intranet moderne pour connecter vos équipes.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
    <html lang="fr">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#fff" />
        {title && <title>{title}</title>}
        {description && <meta name="description" content={description} />}
      </Head>
      <body className="antialiased text-black font-medium bg-white max-w-[1200px] mx-auto">
        <DataProvider>
          <Header />
          {children}
          <Footer />
        </DataProvider>
      </body>
    </html>
  );
}


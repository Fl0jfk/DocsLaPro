'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ClerkProvider, SignedIn, SignedOut, UserButton, SignInButton, SignOutButton } from '@clerk/nextjs';
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
        <body className="antialiased text-black font-medium bg-white mx-auto">
          <DataProvider>
            <Header />
            <div className="flex justify-end p-4 gap-4">
              <SignedOut>
                <SignInButton>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded">
                    Se connecter
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
                <SignOutButton>
                  <button className="bg-gray-400 text-white px-4 py-2 rounded">
                    Se déconnecter
                  </button>
                </SignOutButton>
              </SignedIn>
            </div>
            {children}
            <Footer />
          </DataProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}


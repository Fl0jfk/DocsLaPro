'use client';

import { usePathname } from 'next/navigation';
import { ClerkProvider, SignedIn, SignedOut, UserButton, SignInButton, SignOutButton } from '@clerk/nextjs';
import './globals.css';
import Header from './components/HeaderF/Header';
import Footer from './components/Footer/Footer';
import { DataProvider } from './contexts/data';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ClerkProvider>
      <html lang="fr">
        <body className="antialiased text-black font-medium bg-white mx-auto">
          <DataProvider>
            <Header />
            <div className="flex justify-end p-4 gap-4 pt-[200px]">
              <SignedOut>
                <SignInButton>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded">
                    Se connecter
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton/>
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

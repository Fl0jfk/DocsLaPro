import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations'
import './globals.css';
import Header from './components/Header/Header';
import { DataProvider } from './contexts/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Bienvenue dans l'intranet de La Providence Nicolas Barré",
  description: 'Un intranet moderne pour connecter vos équipes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={frFR}>
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
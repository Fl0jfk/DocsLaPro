import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations'
import '../globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = { 
  title: "Groupe Scolaire La Providence Nicolas Barré", 
  description: 'École, Collège et Lycée au Mesnil-Esnard.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={frFR}>
      <div>{children}</div>
    </ClerkProvider>
  );
}
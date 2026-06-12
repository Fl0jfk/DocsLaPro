import '../globals.css';
import { Metadata } from 'next';
export const metadata: Metadata = { 
  title: "Groupe Scolaire La Providence Nicolas Barré", 
  description: 'École, Collège et Lycée au Mesnil-Esnard.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
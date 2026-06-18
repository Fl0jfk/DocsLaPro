import "../globals.css";
import Header from "../components/Header/Header";
import ScolaAmbientBackground from "../components/ScolaAmbientBackground";
import { AdminBootstrapProvider } from "../contexts/admin-bootstrap";
import { DataProvider } from "../contexts/data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bienvenue dans l'intranet de La Providence Nicolas Barré",
  description: "Un intranet moderne pour connecter vos équipes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScolaAmbientBackground>
      <DataProvider>
        <AdminBootstrapProvider>
          <Header />
          {children}
        </AdminBootstrapProvider>
      </DataProvider>
    </ScolaAmbientBackground>
  );
}

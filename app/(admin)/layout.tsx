import "../globals.css";
import Header from "../components/Header/Header";
import ScolaAmbientBackground from "../components/ScolaAmbientBackground";
import OnboardingGate from "../components/onboarding/OnboardingGate";
import { AdminBootstrapProvider } from "../contexts/admin-bootstrap";
import { DataProvider } from "../contexts/data";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Intranet scolaire",
  description: "Un intranet moderne pour connecter vos équipes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScolaAmbientBackground>
      <DataProvider>
        <AdminBootstrapProvider>
          <Suspense fallback={null}>
            <OnboardingGate>
              <Header />
              {children}
            </OnboardingGate>
          </Suspense>
        </AdminBootstrapProvider>
      </DataProvider>
    </ScolaAmbientBackground>
  );
}

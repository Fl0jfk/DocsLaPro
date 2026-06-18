import Header from "@/app/components/Header/Header";
import ScolaAmbientBackground from "@/app/components/ScolaAmbientBackground";
import { AdminBootstrapProvider } from "@/app/contexts/admin-bootstrap";

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScolaAmbientBackground>
      <AdminBootstrapProvider enableOverlay={false}>
        <Header />
        {children}
      </AdminBootstrapProvider>
    </ScolaAmbientBackground>
  );
}

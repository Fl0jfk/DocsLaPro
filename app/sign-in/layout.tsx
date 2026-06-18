import Header from "@/app/components/Header/Header";
import ScolaAmbientBackground from "@/app/components/ScolaAmbientBackground";

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScolaAmbientBackground>
      <Header />
      {children}
    </ScolaAmbientBackground>
  );
}
import Header from "@/app/components/Header/Header";

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="antialiased text-black font-medium mx-auto relative min-h-screen">
      <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#fbb800]/10 rounded-full blur-[120px] pointer-events-none z-[-1]" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#e94f8a]/10 rounded-full blur-[120px] pointer-events-none z-[-1]" />
      <Header />
      {children}
    </div>
  );
}

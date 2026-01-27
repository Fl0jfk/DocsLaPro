'use client';

import RollingSlider from "./components/Slider/RollingSlider";
import { useData } from "@/app/contexts/data";
import { useUser, SignedOut, SignInButton } from "@clerk/nextjs";

export default function Home() {
  const { isLoaded, user } = useUser();
  const data = useData();
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-[#f8f9fa]">
        <div className="flex flex-col items-center">
          <div className="relative">
             <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500 shadow-sm"></div>
             <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-blue-400 opacity-20"></div>
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-widest text-blue-500/80">Chargement</p>
        </div>
      </div>
    );
  }
  function normalizeRoles(role: unknown): string[] {
    if (Array.isArray(role)) return role as string[];
    if (typeof role === "string") return [role];
    return [];
  }
  const roles = normalizeRoles(user?.publicMetadata?.role);
  const filteredCategories = data.categories.filter(category => 
    (category.allowedRoles ?? []).some(r => roles.includes(r))
  );
  const uniqueCategories = Array.from(
    new Map(filteredCategories.map(cat => [cat.id ?? cat.name, cat])).values()
  );

  return (
    <main className="relative flex flex-col w-full min-h-screen overflow-hidden mt-[10vh] max-w-[1500px] mx-auto">
      <div className="relative z-10 w-full flex flex-col flex-grow">
        {uniqueCategories.length > 0 ? (
          <div className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <RollingSlider categories={uniqueCategories} />
          </div>
        ) : (
          <div className="text-center opacity-50">
            <p className="text-sm font-medium italic text-gray-400">Aucun contenu disponible pour votre profil.</p>
          </div>
        )}
        <SignedOut>
          <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px] z-50">
            <div className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col items-center max-w-sm w-full mx-4">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-3xl mb-6 shadow-lg shadow-blue-200">
                🔒
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Espace Privé</h2>
              <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
                Veuillez vous identifier pour accéder à vos services Providence.
              </p>
              
              <SignInButton mode="modal">
                <button className="w-full py-4 px-8 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl">
                  Se connecter
                </button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>

      </div>
    </main>
  );
}
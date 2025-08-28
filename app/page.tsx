'use client';

import RollingSlider from "./components/Slider/RollingSlider";
import { useData } from "@/app/contexts/data";
import { useUser, SignedOut, SignInButton } from "@clerk/nextjs";

export default function Home() {
  const { isLoaded, user } = useUser();
  const data = useData();
  if (!isLoaded) {
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <div className="flex flex-col items-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-4 text-lg font-medium text-gray-600">Chargement en cours…</p>
      </div>
    </div>
  );
}
  const roles = Array.isArray(user?.publicMetadata?.role)
    ? user?.publicMetadata?.role as string[]
    : user?.publicMetadata?.role
      ? [user?.publicMetadata?.role as string]
      : [];
  const filteredCategories = data.categories.filter(category =>
    category.allowedRoles.some(r => roles.includes(r))
  );
  const uniqueCategories = Array.from(
    new Map(filteredCategories.map(cat => [cat.id ?? cat.name, cat])).values()
  );
  return (
    <main className="flex flex-col w-full text-xl sm:pt-[15vh]">
      {uniqueCategories.length > 0 && (
        <RollingSlider categories={uniqueCategories} />
      )}
      <SignedOut>
        <SignInButton>
          <button className="absolute top-[48%] left-[38%] p-4">
            Se connecter
          </button>
        </SignInButton>
      </SignedOut>
    </main>
  );
}

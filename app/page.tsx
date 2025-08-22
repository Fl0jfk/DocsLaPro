'use client';

import RollingSlider from "./components/Slider/RollingSlider";
import { useData } from "@/app/contexts/data";
import {useUser, SignedOut, SignInButton } from "@clerk/nextjs";

export default function Home() {
  const { isLoaded, user } = useUser();
  const data = useData();
  if (!isLoaded) return <div>Chargement...</div>;
  const role = user?.publicMetadata?.role as string | undefined;
  const filteredCategories = data.categories.filter(category => category.allowedRoles.includes(role ?? ""));
  return (
    <main className="flex flex-col w-full text-xl sm:pt-[15vh]">
        {filteredCategories.length > 0 && (
          <RollingSlider categories={filteredCategories} />
        )}
        <SignedOut>
          <SignInButton>
            <button className="absolute top-[48%] left-[38%] p-4">Se connecter</button>
          </SignInButton>
        </SignedOut>
    </main>
  );
}



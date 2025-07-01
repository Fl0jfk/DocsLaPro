'use client';

import RollingSlider from "./components/Slider/RollingSlider";
import { useData } from "@/app/contexts/data";
import { useUser } from '@clerk/nextjs';
import UploadDocument from "./components/UploadDocument/UploadDocument";
import ExplorerEleves from "./components/EditEleves/EditEleves";

export default function Home() {
  const { isLoaded, user } = useUser();
  const data = useData();
  if (!isLoaded) return <div>Chargement...</div>;
  const role = user?.publicMetadata?.role as string | undefined;
  const filteredCategories = data.categories.filter(category => 
    category.allowedRoles.includes(role ?? "")
  );
  return (
    <main className="flex flex-col w-full text-xl md:pt-[15vh] sm:pt-[15vh]">
      {filteredCategories.length > 0 && (
        <RollingSlider categories={filteredCategories} />
      )}
      <UploadDocument/>
      <ExplorerEleves/>
    </main>
  );
}



import { Suspense } from "react";
import RhModuleClient from "@/app/(admin)/rh/RhModuleClient";

export default function RhModulePage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-slate-500">Chargement du module RH…</p>}>
      <RhModuleClient />
    </Suspense>
  );
}

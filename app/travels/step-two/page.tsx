"use client";
import { Suspense } from "react";
import VoyageEtape2Form from "./form";

export default function Page() {
  return (
    <Suspense fallback={<div>Chargement de l’étape 2…</div>}>
      <VoyageEtape2Form />
    </Suspense>
  );
}
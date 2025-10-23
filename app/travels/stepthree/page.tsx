"use client";
import { Suspense } from "react";
import Step3Form from "./form";

export default function Page() {
  return (
    <Suspense fallback={<div>Chargement de l’étape 3…</div>}>
      <Step3Form/>
    </Suspense>
  );
}
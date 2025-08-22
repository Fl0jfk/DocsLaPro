"use client";
import { Suspense } from "react";
import DepotDevisForm from "./form";

export default function Page() {
  return (
    <Suspense fallback={<div>Chargement du formulaire…</div>}>
      <DepotDevisForm />
    </Suspense>
  );
}

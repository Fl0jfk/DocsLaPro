"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function VoyagesDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [voyages, setVoyages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isLoaded || !user) return;
    const fetchData = async () => {
      const res = await fetch("/api/travels/list");
      const data = await res.json();
      setVoyages(data.voyages || []);
      setLoading(false);
    };
    fetchData();
  }, [isLoaded, user]);
  if (!isLoaded) return <div>Chargement…</div>;
  if (!user) return <div>Veuillez vous connecter.</div>;
  if (loading) return <div>Chargement des voyages…</div>
  const normalizeRoles = (role: unknown): string[] => {
    if (Array.isArray(role)) return role as string[];
    if (typeof role === "string") return [role];
    return [];
  };
  const roles = normalizeRoles(user.publicMetadata?.role);
  const canEdit = (voyage: any) => {
    if (voyage.email === user.primaryEmailAddress?.emailAddress) return true;
    if (roles.includes("compta")) return true;
    if (roles.includes(voyage.direction_cible)) return true;
    return false;
  };
  return (
    <div className="pt-[15vh] px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Tableau de bord des voyages
      </h1>
      {voyages.length === 0 && (
        <p className="text-center text-gray-500">
          Aucun voyage trouvé pour le moment.
        </p>
      )}
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {voyages.map((voyage) => {
          const editable = canEdit(voyage);
          return (
            <div
              key={voyage.id}
              className={`rounded-2xl p-4 shadow transition ${
                editable
                  ? "bg-white hover:shadow-lg cursor-pointer"
                  : "bg-gray-200 opacity-70 cursor-not-allowed"
              }`}
              onClick={() =>
                editable && router.push(`/travels/${voyage.id}/edit`)
              }
            >
              <h3 className="text-lg font-semibold">{voyage.lieu}</h3>
              <p className="text-sm text-gray-600">{voyage.activite}</p>
              <p className="text-sm text-gray-500">
                {voyage.date_depart} → {voyage.date_retour}
              </p>
              <p className="text-sm text-gray-500">
                {voyage.classes} ({voyage.effectif_eleves} élèves)
              </p>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded mt-2 inline-block ${
                  voyage.etat === "validee"
                    ? "bg-green-100 text-green-700"
                    : voyage.etat === "refusee"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {voyage.etat}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

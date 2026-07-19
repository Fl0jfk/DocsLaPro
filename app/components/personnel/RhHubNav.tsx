"use client";

export type RhHubTab =
  | "dashboard"
  | "annuaire"
  | "admin"
  | "onboarding"
  | "registre"
  | "temps"
  | "organigramme"
  | "deposit";

const TABS: { id: RhHubTab; label: string; desc?: string }[] = [
  { id: "dashboard", label: "Tableau de bord" },
  { id: "annuaire", label: "Annuaire" },
  { id: "admin", label: "Entrées / sorties" },
  { id: "onboarding", label: "Nouveaux arrivants" },
  { id: "registre", label: "Registre" },
  { id: "temps", label: "Congés & absences" },
  { id: "organigramme", label: "Organigramme" },
  { id: "deposit", label: "Dépôt IA" },
];

export default function RhHubNav({
  active,
  onChange,
  canManage,
}: {
  active: RhHubTab;
  onChange: (tab: RhHubTab) => void;
  canManage: boolean;
}) {
  const visible = TABS.filter((t) => {
    if (canManage) return true;
    return t.id === "dashboard" || t.id === "annuaire" || t.id === "organigramme";
  });

  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {visible.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            active === tab.id
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

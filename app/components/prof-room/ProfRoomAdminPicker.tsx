"use client";

import { useMemo, useState } from "react";

export type ClerkMemberOption = {
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  pending?: boolean;
};

function memberLabel(m: ClerkMemberOption): string {
  const name = m.displayName || `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim();
  return name || m.email;
}

export default function ProfRoomAdminPicker({
  members,
  selectedIds,
  onChange,
  loading,
}: {
  members: ClerkMemberOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
}) {
  const [search, setSearch] = useState("");

  const activeMembers = useMemo(
    () => members.filter((m) => m.clerkUserId && !m.pending),
    [members],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeMembers;
    return activeMembers.filter((m) => {
      const hay = `${memberLabel(m)} ${m.email} ${m.lastName ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeMembers, search]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement des utilisateurs Clerk…</p>;
  }

  return (
    <div className="space-y-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher une personne…"
        className="w-full border rounded-xl px-3 py-2.5 text-sm"
      />
      <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y bg-white">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-slate-400 italic">Aucune personne trouvée.</p>
        ) : (
          filtered.map((m) => (
            <label
              key={m.clerkUserId}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(m.clerkUserId)}
                onChange={() => toggle(m.clerkUserId)}
                className="rounded border-slate-300"
              />
              <span className="flex-1 min-w-0">
                <span className="font-bold text-slate-800 block truncate">{memberLabel(m)}</span>
                <span className="text-xs text-slate-500 truncate block">{m.email}</span>
                {m.lastName && (
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                    Nom de famille utilisé : {m.lastName.toUpperCase()}
                  </span>
                )}
              </span>
            </label>
          ))
        )}
      </div>
      <p className="text-xs text-slate-500">
        {selectedIds.length} administrateur(s) sélectionné(s). Le mode admin du planning utilise le nom de famille
        Clerk de chaque personne.
      </p>
    </div>
  );
}

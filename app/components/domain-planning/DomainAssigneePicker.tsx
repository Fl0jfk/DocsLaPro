"use client";

import { useMemo, useState } from "react";

export type ClerkAssigneeOption = {
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  pending?: boolean;
};

function labelOf(u: ClerkAssigneeOption): string {
  const name = u.displayName || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return name || u.email;
}

export default function DomainAssigneePicker({
  users,
  value,
  onChange,
  loading,
  disabled,
}: {
  users: ClerkAssigneeOption[];
  value: string;
  onChange: (user: ClerkAssigneeOption | null) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const activeUsers = useMemo(
    () => users.filter((u) => u.clerkUserId && !u.pending),
    [users],
  );

  const selected = activeUsers.find((u) => u.clerkUserId === value) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeUsers;
    return activeUsers.filter((u) => {
      const hay = `${labelOf(u)} ${u.email} ${u.lastName ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeUsers, search]);

  if (loading) {
    return <p className="text-sm text-slate-400">Chargement des utilisateurs…</p>;
  }

  return (
    <div className="relative space-y-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm font-bold text-blue-300 hover:border-violet-500 transition-colors disabled:opacity-50"
      >
        {selected ? (
          <span>
            {labelOf(selected)}
            <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{selected.email}</span>
          </span>
        ) : (
          <span className="text-slate-500">Choisir un professeur (utilisateur Clerk)…</span>
        )}
      </button>
      {selected && !disabled && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs font-bold text-slate-500 hover:text-slate-300"
        >
          Effacer la sélection
        </button>
      )}
      {open && !disabled && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-700">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou e-mail…"
              className="w-full bg-slate-900 border-none rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto divide-y divide-slate-700">
            {filtered.length === 0 ? (
              <li className="p-4 text-sm text-slate-500 italic">Aucun utilisateur trouvé.</li>
            ) : (
              filtered.map((u) => (
                <li key={u.clerkUserId}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors ${
                      u.clerkUserId === value ? "bg-violet-900/40" : ""
                    }`}
                    onClick={() => {
                      onChange(u);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <span className="block text-sm font-bold text-white">{labelOf(u)}</span>
                    <span className="block text-xs text-slate-400">{u.email}</span>
                    {u.lastName && (
                      <span className="block text-[10px] text-slate-500 uppercase">{u.lastName}</span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

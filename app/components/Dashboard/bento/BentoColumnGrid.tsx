"use client";

import type { ReactNode } from "react";

export type BentoColumnItem = {
  id: string;
  node: ReactNode;
};

/** Grille à colonnes indépendantes (chaque colonne = pile verticale). */
export default function BentoColumnGrid({
  columns,
}: {
  columns: BentoColumnItem[][];
}) {
  if (columns.length === 0) return null;

  return (
    <div
      className="grid items-start gap-4"
      style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
    >
      {columns.map((colItems, colIndex) => (
        <div key={colIndex} className="flex min-w-0 flex-col gap-4">
          {colItems.map((item) => (
            <div key={item.id} className="min-w-0">
              {item.node}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

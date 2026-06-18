export type BentoWidgetSize = "sm" | "md" | "lg";

export type DashboardViewport = "mobile" | "tablet" | "desktop";

export function getDashboardViewport(width: number): DashboardViewport {
  if (width >= 1024) return "desktop";
  if (width >= 768) return "tablet";
  return "mobile";
}

export function getDashboardGridCols(viewport: DashboardViewport): number {
  if (viewport === "desktop") return 3;
  if (viewport === "tablet") return 2;
  return 1;
}

/** Taille d’affichage des widgets selon le viewport (plus de redimensionnement manuel). */
export function getBentoWidgetSize(viewport: DashboardViewport): BentoWidgetSize {
  if (viewport === "desktop") return "lg";
  if (viewport === "tablet") return "md";
  return "sm";
}

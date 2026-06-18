export type BentoWidgetSize = "sm" | "md" | "lg";

export function getBentoWidgetSize(span: { colSpan: number; rowSpan: number }): BentoWidgetSize {
  const area = span.colSpan * span.rowSpan;
  if (span.colSpan >= 12) return "lg";
  if (span.colSpan <= 3 || area <= 6) return "sm";
  if (span.colSpan >= 6 && span.rowSpan >= 3) return "lg";
  if (area >= 15) return "lg";
  return "md";
}

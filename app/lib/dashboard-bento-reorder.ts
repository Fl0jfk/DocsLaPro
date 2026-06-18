/**
 * Déplace un module dans la liste visible.
 * @param insertIndex Position cible (0 = début, length = fin) dans l’ordre **avant** retrait.
 */
export function reorderVisibleModuleIds(
  visible: string[],
  moduleId: string,
  insertIndex: number,
): string[] {
  const from = visible.indexOf(moduleId);
  if (from < 0) return visible;

  const next = [...visible];
  const [item] = next.splice(from, 1);

  let to = Math.max(0, Math.min(insertIndex, visible.length));
  if (from < to) to -= 1;
  to = Math.max(0, Math.min(to, next.length));

  next.splice(to, 0, item);
  return next;
}

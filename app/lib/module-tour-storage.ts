const storageKey = (userId: string) => `scola-module-tours:${userId}`;

export function readCompletedModuleTours(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map(String));
  } catch {
    return new Set();
  }
}

export function markModuleTourCompleted(userId: string, moduleId: string) {
  const set = readCompletedModuleTours(userId);
  set.add(moduleId);
  localStorage.setItem(storageKey(userId), JSON.stringify([...set]));
}

export function resetModuleTour(userId: string, moduleId: string) {
  const set = readCompletedModuleTours(userId);
  set.delete(moduleId);
  localStorage.setItem(storageKey(userId), JSON.stringify([...set]));
}

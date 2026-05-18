export function normRole(s: string) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, " ")
    .trim();
}

export function getDocumentKeys(data: { documentKey?: string; documentKeys?: string[] }): string[] {
  const fromArray = Array.isArray(data.documentKeys)
    ? data.documentKeys.map((k) => String(k || "").trim()).filter(Boolean)
    : [];
  if (fromArray.length > 0) return fromArray;
  const legacy = String(data.documentKey || "").trim();
  return legacy ? [legacy] : [];
}

export function isAdministratifRole(roles: string[]) {
  return roles.map(normRole).some((r) => r.includes("administratif"));
}

export function isDocumentKeyReferenced(index: { data: { documentKey?: string; documentKeys?: string[] } }[], key: string) {
  const trimmed = key.trim();
  if (!trimmed) return false;
  return index.some((r) => getDocumentKeys(r.data).includes(trimmed));
}

import type { AbsenceRecord } from "@/app/lib/absences-types";

export function getDocumentKeys(data?: {
  documentKeys?: string[];
  documentKey?: string;
  justification?: { fileUrl?: string } | null;
} | null): string[] {
  if (!data) return [];
  const fromArray = Array.isArray(data.documentKeys)
    ? data.documentKeys.map((k) => String(k || "").trim()).filter(Boolean)
    : [];
  if (fromArray.length > 0) return fromArray;
  const legacy = String((data as { documentKey?: string }).documentKey || "").trim();
  return legacy ? [legacy] : [];
}

export function getAbsenceDocumentKeys(record: AbsenceRecord): string[] {
  return getDocumentKeys(record?.data);
}

export function isDocumentKeyReferenced(index: AbsenceRecord[], key: string) {
  const trimmed = key.trim();
  if (!trimmed) return false;
  return index.some((r) => getAbsenceDocumentKeys(r).includes(trimmed));
}

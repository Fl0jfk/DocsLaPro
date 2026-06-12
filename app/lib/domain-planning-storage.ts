import { getJson, putJson } from "@/app/lib/s3-storage";
import { DEFAULT_DOMAIN_PLANNING_DOMAINS } from "@/app/lib/domain-planning-defaults";
import type { DomainPlanningBooking, DomainPlanningDomain } from "@/app/lib/domain-planning-types";

export const DOMAINS_KEY = "domain-planning/domains.json";
export const BOOKINGS_KEY = "domain-planning/bookings.json";

function parseDomain(raw: unknown): DomainPlanningDomain | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!id || !name) return null;
  const coordinatorClerkUserIds = Array.isArray(o.coordinatorClerkUserIds)
    ? o.coordinatorClerkUserIds.map((x) => String(x).trim()).filter(Boolean)
    : [];
  return {
    id,
    name,
    description: typeof o.description === "string" ? o.description.trim() : undefined,
    color: typeof o.color === "string" ? o.color.trim() : undefined,
    coordinatorClerkUserIds,
  };
}

export async function loadDomains(): Promise<DomainPlanningDomain[]> {
  const hit = await getJson<{ domains?: unknown[] } | unknown[]>(DOMAINS_KEY);
  const data = hit?.data;
  const raw = Array.isArray(data) ? data : (data as { domains?: unknown[] })?.domains;
  if (!raw?.length) return [...DEFAULT_DOMAIN_PLANNING_DOMAINS];
  const parsed = raw.map(parseDomain).filter(Boolean) as DomainPlanningDomain[];
  return parsed.length > 0 ? parsed : [...DEFAULT_DOMAIN_PLANNING_DOMAINS];
}

export async function saveDomains(domains: DomainPlanningDomain[]): Promise<void> {
  await putJson(DOMAINS_KEY, { domains });
}

export async function loadBookings(): Promise<DomainPlanningBooking[]> {
  const hit = await getJson<DomainPlanningBooking[]>(BOOKINGS_KEY);
  return Array.isArray(hit?.data) ? hit.data : [];
}

export async function saveBookings(bookings: DomainPlanningBooking[]): Promise<void> {
  await putJson(BOOKINGS_KEY, bookings);
}

export async function findDomainById(domainId: string): Promise<DomainPlanningDomain | null> {
  const domains = await loadDomains();
  return domains.find((d) => d.id === domainId) ?? null;
}

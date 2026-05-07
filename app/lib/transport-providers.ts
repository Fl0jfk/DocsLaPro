export type TransportProvider = { name: string; email: string };

export const TRANSPORT_PROVIDERS: TransportProvider[] = [
  { name: "Perrier", email: "stephanie.fouin@cars-perier.fr" },
  { name: "Reflexe", email: "contact@reflexe-voyages.com" },
  { name: "Grisel", email: "j.saint-denis@grisel-voyages.fr" },
  { name: "Hangard", email: "carole@hangard-autocars.com" },
];

const norm = (e: string) => e.trim().toLowerCase();

export function providerNameFromEmail(fromEmail: string): string | null {
  const n = norm(fromEmail);
  const p = TRANSPORT_PROVIDERS.find((t) => norm(t.email) === n);
  return p?.name ?? null;
}

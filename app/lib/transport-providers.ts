export type TransportProvider = { name: string; email: string };

/** Liste unique utilisée pour les envois et le rapprochement des e-mails entrants. */
export const TRANSPORT_PROVIDERS: TransportProvider[] = [
  { name: "Perrier", email: "perrier-voyages@orange.fr" },
  { name: "Reflexe", email: "florian.hacqueville-mathi@ac-normandie.fr" },
  { name: "Cars Bleus", email: "carbleus@mail.fr" },
  { name: "Hangard", email: "hangard.autocars@outlook.fr" },
];

const norm = (e: string) => e.trim().toLowerCase();

export function providerNameFromEmail(fromEmail: string): string | null {
  const n = norm(fromEmail);
  const p = TRANSPORT_PROVIDERS.find((t) => norm(t.email) === n);
  return p?.name ?? null;
}

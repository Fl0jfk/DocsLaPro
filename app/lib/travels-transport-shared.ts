/** Utilitaires transport — safe client & serveur. */

export function orderEmailForQuote(quote: {
  extractedContactEmail?: string | null;
  providerEmail?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!quote) return "";
  const a = quote.extractedContactEmail?.trim();
  const b = quote.providerEmail?.trim();
  const c = quote.email?.trim();
  return (a || b || c || "").trim();
}

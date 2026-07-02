/**
 * Pages publiques visiteurs (rentrée, simulateurs, landing…) où l'assistant IA
 * et le lien « Espace personnel » ne doivent pas apparaître.
 */
export function isPublicVisitorPath(pathname: string | null | undefined): boolean {
  const path = (pathname ?? "").toLowerCase();
  if (!path || path === "/") return true;

  const exact = new Set([
    "/connexion",
    "/plateforme",
    "/mentions-legales",
    "/tarifs",
    "/demande/merci",
  ]);

  if (exact.has(path)) return true;

  const prefixes = [
    "/rentree",
    "/documents/rentree",
    "/simulateurtarifs",
    "/simulateurfournitures",
    "/portes-ouvertes",
    "/faire-une-demande",
    "/internat/autorisation",
    "/stages/eleve",
    "/stages/deposer",
    "/stages/signer",
    "/stages/candidater",
    "/certificates/verify",
  ];

  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

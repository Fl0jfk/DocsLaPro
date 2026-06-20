/** Origine publique de la vitrine plateforme (portail connexion + admin Master). */
export function platformAppOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_PLATFORM_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://scola.fr";

  try {
    const withScheme = raw.startsWith("http") ? raw : `https://${raw}`;
    return new URL(withScheme).origin;
  } catch {
    return "https://scola.fr";
  }
}

export function platformConnexionUrl(): string {
  return `${platformAppOrigin()}/connexion`;
}

/** Connexion Master plateforme — toujours sur docslapro.com / scola.fr, jamais sur un sous-domaine établissement. */
export function platformAdminSignInUrl(): string {
  const redirect = encodeURIComponent("/plateforme");
  return `${platformAppOrigin()}/sign-in?redirect_url=${redirect}`;
}

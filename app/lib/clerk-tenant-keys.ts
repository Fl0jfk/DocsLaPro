/** En dev : pk_test_/sk_test_ dans .env.local remplacent Clerk live du registry (localhost). */

export function clerkKeysFromEnvOverride(): {
  publishableKey: string;
  secretKey: string;
} | null {
  if (process.env.NODE_ENV === "production") return null;

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  const secretKey = process.env.CLERK_SECRET_KEY?.trim() ?? "";
  if (!publishableKey.startsWith("pk_test_") || !secretKey.startsWith("sk_test_")) {
    return null;
  }
  return { publishableKey, secretKey };
}

export function resolveClerkPublishableKey(tenantKey: string): string {
  return clerkKeysFromEnvOverride()?.publishableKey ?? tenantKey;
}

export function resolveClerkSecretKey(tenantKey: string): string {
  return clerkKeysFromEnvOverride()?.secretKey ?? tenantKey;
}

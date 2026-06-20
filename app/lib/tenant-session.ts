import "server-only";

import { createClerkClient, type User } from "@clerk/backend";
import { headers } from "next/headers";
import { getTenant } from "@/app/lib/tenant-context";
import { normalizeHostname } from "@/app/lib/tenant-registry";

/** Reconstruit la requête HTTP courante (cookies inclus) pour Clerk backend. */
async function incomingClerkRequest(): Promise<Request> {
  const hdrs = await headers();
  const headerInit = new Headers();
  hdrs.forEach((value, key) => {
    headerInit.set(key, value);
  });

  const host = normalizeHostname(hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost");
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const path = hdrs.get("x-invoke-path") || hdrs.get("next-url") || "/";

  const absolutePath = path.startsWith("http")
    ? path
    : `${proto}://${host}${path.startsWith("/") ? path : `/${path}`}`;

  return new Request(absolutePath, { headers: headerInit });
}

/** Session via la clé secrète du tenant (sans clés dynamiques Clerk / CLERK_ENCRYPTION_KEY). */
export async function resolveTenantSession(): Promise<{ userId: string } | null> {
  const tenant = await getTenant();
  const secretKey = tenant.clerkSecretKey?.trim();
  if (!secretKey) return null;

  const request = await incomingClerkRequest();
  const host = normalizeHostname(
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "",
  );
  const clerk = createClerkClient({
    secretKey,
    publishableKey: tenant.clerkPublishableKey,
  });

  const state = await clerk.authenticateRequest(request, {
    secretKey,
    publishableKey: tenant.clerkPublishableKey,
    authorizedParties: host ? [`https://${host}`, `http://${host}`] : undefined,
  });

  if (state.isAuthenticated) {
    const authObj = state.toAuth();
    if (authObj.userId) return { userId: authObj.userId };
  }

  return null;
}

export async function resolveTenantCurrentUser(): Promise<User | null> {
  const session = await resolveTenantSession();
  if (!session) return null;

  const tenant = await getTenant();
  const clerk = createClerkClient({ secretKey: tenant.clerkSecretKey });
  try {
    return await clerk.users.getUser(session.userId);
  } catch (error) {
    console.error("[resolveTenantCurrentUser]", error);
    return null;
  }
}

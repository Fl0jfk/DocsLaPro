import "server-only";

import { createClerkClient, type User } from "@clerk/backend";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { getTenant } from "@/app/lib/tenant-context";
import { TENANT_REQUEST_URL_HEADER } from "@/app/lib/tenant-types";
import type { TenantConfig } from "@/app/lib/tenant-types";
import { normalizeHostname } from "@/app/lib/tenant-registry";

function clerkRequestFromHeaders(hdrs: Headers, fallbackUrl?: string): Request {
  const headerInit = new Headers();
  hdrs.forEach((value, key) => {
    headerInit.set(key, value);
  });

  const explicitUrl = hdrs.get(TENANT_REQUEST_URL_HEADER)?.trim();
  if (explicitUrl) {
    return new Request(explicitUrl, { headers: headerInit });
  }

  const host = normalizeHostname(hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost");
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const path =
    hdrs.get("x-invoke-path") ||
    hdrs.get("next-url") ||
    (fallbackUrl ? new URL(fallbackUrl).pathname + new URL(fallbackUrl).search : "/");

  const absolutePath = path.startsWith("http")
    ? path
    : `${proto}://${host}${path.startsWith("/") ? path : `/${path}`}`;

  return new Request(absolutePath, { headers: headerInit });
}

/** Reconstruit la requête HTTP courante (cookies inclus) pour Clerk backend. */
async function incomingClerkRequest(): Promise<Request> {
  const hdrs = await headers();
  return clerkRequestFromHeaders(hdrs);
}

export function clerkRequestFromNextRequest(request: NextRequest): Request {
  const headerInit = new Headers();
  request.headers.forEach((value, key) => {
    headerInit.set(key, value);
  });
  return clerkRequestFromHeaders(headerInit, request.url);
}

async function authenticateTenantRequest(
  request: Request,
  tenant: TenantConfig,
): Promise<{ userId: string } | null> {
  const secretKey = tenant.clerkSecretKey?.trim();
  if (!secretKey) return null;

  try {
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
  } catch (error) {
    console.error("[authenticateTenantRequest]", error);
  }

  return null;
}

/** Session via la clé secrète du tenant (middleware + routes API). */
export async function resolveTenantSessionFromRequest(
  request: NextRequest,
  tenant: TenantConfig,
): Promise<{ userId: string } | null> {
  return authenticateTenantRequest(clerkRequestFromNextRequest(request), tenant);
}

/** Session via la clé secrète du tenant (sans clés dynamiques Clerk / CLERK_ENCRYPTION_KEY). */
export async function resolveTenantSession(): Promise<{ userId: string } | null> {
  const tenant = await getTenant();
  const request = await incomingClerkRequest();
  return authenticateTenantRequest(request, tenant);
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

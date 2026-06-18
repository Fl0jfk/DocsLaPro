import { createClerkClient } from '@clerk/backend';
import {
  clerkMiddleware,
  createRouteMatcher,
  type ClerkMiddlewareAuth,
} from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TENANT_SLUG_HEADER, type TenantConfig } from '@/app/lib/tenant-types';
import {
  defaultTenantFromEnv,
  isMultiTenantEnabled,
  normalizeHostname,
  resolveTenantByHostname,
  resolveTenantByHostnameSync,
  warmTenantRegistry,
} from '@/app/lib/tenant-registry';
import {
  resolveClerkKeysForHostname,
} from '@/app/lib/clerk-tenant-keys';
import {
  canAccessIntranetPath,
  isOrgAdminFromSession,
} from '@/app/lib/intranet-modules';
import {
  intranetRolesFromMetadata,
  intranetRolesFromSessionClaims,
  publicMetadataFromSessionClaims,
} from '@/app/lib/intranet-roles';
import { contentSecurityPolicyHeaderValue } from '@/app/lib/content-security-policy';

const isPublicRoute = createRouteMatcher([
  '/',
  '/rentree(.*)',
  '/simulateurTarifs(.*)',
  '/simulateurFournitures(.*)',
  '/faire-une-demande(.*)',
  '/demande/merci',
  '/api/travels/ingest-from-email',
  '/api/requests/create',
  '/api/requests/confirm',
  '/api/supplies/send',
  '/api/chatbot',
  '/api/site/public',
  '/api/tenant/public',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/mentions-legales',
  '/tarifs',
  '/internat/autorisation(.*)',
  '/api/internat/outings/decision(.*)',
]);

async function resolveTenantForProxy(request: NextRequest): Promise<TenantConfig> {
  await warmTenantRegistry();

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.hostname;

  const cached = resolveTenantByHostnameSync(host);
  if (cached) return cached;

  try {
    return await resolveTenantByHostname(host);
  } catch {
    if (!process.env.REGISTRY_BUCKET?.trim() && !process.env.TENANT_INDEX_JSON?.trim()) {
      return defaultTenantFromEnv();
    }
    throw new Error(`Domaine non configuré : ${normalizeHostname(host)}`);
  }
}

function withTenantHeaders(response: NextResponse, tenant: TenantConfig): NextResponse {
  response.headers.set(TENANT_SLUG_HEADER, tenant.slug);
  response.headers.set("x-tenant-bucket", tenant.dataBucket);
  response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue());
  return response;
}

function clerkClientForProxy(tenant: TenantConfig, hostname: string) {
  const keys = resolveClerkKeysForHostname(hostname, {
    clerkPublishableKey: tenant.clerkPublishableKey,
    clerkSecretKey: tenant.clerkSecretKey,
    clerkDevPublishableKey: tenant.secrets?.clerkDevPublishableKey,
    clerkDevSecretKey: tenant.secrets?.clerkDevSecretKey,
  });
  const secretKey = keys.secretKey
    ?? (isMultiTenantEnabled() ? tenant.clerkSecretKey : process.env.CLERK_SECRET_KEY);
  if (!secretKey?.trim()) {
    throw new Error("CLERK_SECRET_KEY manquante");
  }
  return createClerkClient({ secretKey });
}

type ProxyAuthState = {
  userId: string;
  orgRole?: string | null;
  sessionClaims: unknown;
};

async function resolveIntranetRolesForProxy(
  authState: ProxyAuthState,
  tenant: TenantConfig,
  hostname: string,
): Promise<{ roles: string[]; publicMetadata: Record<string, unknown> | undefined }> {
  const claims = authState.sessionClaims as Record<string, unknown> | undefined;
  let publicMetadata = publicMetadataFromSessionClaims(claims);
  let roles = intranetRolesFromSessionClaims(claims);

  if (roles.length === 0 && authState.userId) {
    try {
      const user = await clerkClientForProxy(tenant, hostname).users.getUser(authState.userId);
      publicMetadata = user.publicMetadata as Record<string, unknown>;
      roles = intranetRolesFromMetadata(publicMetadata);
    } catch {
      // Session valide mais métadonnées indisponibles — accès module refusé.
    }
  }

  return { roles, publicMetadata };
}

async function clerkAuthHandler(auth: ClerkMiddlewareAuth, request: NextRequest) {
  let tenant: TenantConfig;
  try {
    tenant = await resolveTenantForProxy(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tenant inconnu";
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return new NextResponse(message, { status: 404 });
  }
  if (isPublicRoute(request)) { return withTenantHeaders(NextResponse.next(), tenant)}
  const authState = await auth.protect();
  const { roles, publicMetadata } = await resolveIntranetRolesForProxy(
    authState,
    tenant,
    request.nextUrl.hostname,
  );
  const isOrgAdmin = isOrgAdminFromSession(authState.orgRole, publicMetadata);
  const pathname = request.nextUrl.pathname;

  if (!canAccessIntranetPath(pathname, roles, isOrgAdmin)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Accès refusé à ce module.", code: "MODULE_FORBIDDEN" },
        { status: 403 },
      );
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return withTenantHeaders(NextResponse.next(), tenant);
}

async function clerkOptionsForTenant(request: NextRequest) {
  try {
    const tenant = await resolveTenantForProxy(request);
    return resolveClerkKeysForHostname(request.nextUrl.hostname, {
      clerkPublishableKey: tenant.clerkPublishableKey,
      clerkSecretKey: tenant.clerkSecretKey,
      clerkDevPublishableKey: tenant.secrets?.clerkDevPublishableKey,
      clerkDevSecretKey: tenant.secrets?.clerkDevSecretKey,
    });
  } catch {
    const fallback = defaultTenantFromEnv();
    return resolveClerkKeysForHostname(request.nextUrl.hostname, fallback);
  }
}

export default isMultiTenantEnabled()
  ? clerkMiddleware(clerkAuthHandler, clerkOptionsForTenant)
  : clerkMiddleware(clerkAuthHandler);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|otf|mp4|mp3|pdf)).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};

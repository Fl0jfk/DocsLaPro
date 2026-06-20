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
  resolveLocalDevTenantFromList,
  resolveTenantByHostname,
  resolveTenantByHostnameSync,
  warmTenantRegistry,
  getCachedTenants,
} from '@/app/lib/tenant-registry';
import { isLocalDevHostname, clerkKeysFromEnv, resolveClerkKeysForHostname } from '@/app/lib/clerk-tenant-keys';
import { isPlatformHostname } from '@/app/lib/platform-hostname';
import { isPlatformTenantSlug, platformTenantFromEnv } from '@/app/lib/platform-tenant';
import { clerkSignInPageUrl } from '@/app/lib/tenant-auth-urls';
import { resolveTenantSessionFromRequest } from '@/app/lib/tenant-session';
import { tenantCanonicalHostname, tenantCanonicalOrigin } from '@/app/lib/tenant-auth-urls';
import {
  canAccessIntranetPath,
  isOrgAdminFromSession,
} from '@/app/lib/intranet-modules';
import { hasMasterRole } from '@/app/lib/intranet-role-utils';
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
  '/portes-ouvertes(.*)',
  '/api/toolbox/public',
  '/api/portes-ouvertes/register',
  '/faire-une-demande(.*)',
  '/demande/merci',
  '/api/travels/ingest-from-email',
  '/api/requests/create',
  '/api/requests/confirm',
  '/api/supplies/send',
  '/api/chatbot',
  '/api/site/public',
  '/api/tenant/public',
  '/api/tenants/public',
  '/connexion',
  '/plateforme',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sign-out(.*)',
  '/mentions-legales',
  '/tarifs',
  '/internat/autorisation(.*)',
  '/api/internat/outings/decision(.*)',
  '/stages/eleve(.*)',
  '/stages/signer(.*)',
  '/stages/candidater(.*)',
  '/api/stages/public(.*)',
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
    const normalized = normalizeHostname(host);
    if (isPlatformHostname(normalized)) {
      return platformTenantFromEnv();
    }
    if (isLocalDevHostname(normalized)) {
      const cached = getCachedTenants();
      if (cached?.length) {
        const devTenant = resolveLocalDevTenantFromList(cached);
        if (devTenant) return devTenant;
      }
    }
    if (!process.env.REGISTRY_BUCKET?.trim() && !process.env.TENANT_INDEX_JSON?.trim()) {
      return defaultTenantFromEnv();
    }
    throw new Error(`Domaine non configuré : ${normalized}`);
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

function redirectToTenantCanonicalHost(
  request: NextRequest,
  tenant: TenantConfig,
  host: string,
): NextResponse | null {
  if (isLocalDevHostname(host)) return null;

  const canonicalHost = tenantCanonicalHostname(tenant);
  if (!canonicalHost || normalizeHostname(host) === canonicalHost) return null;

  const dest = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, tenantCanonicalOrigin(tenant));
  return NextResponse.redirect(dest);
}

function platformAppOriginFromEnv(): string {
  const raw =
    process.env.PLATFORM_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://scola.fr";
  try {
    const withScheme = raw.startsWith("http") ? raw : `https://${raw}`;
    return new URL(withScheme).origin;
  } catch {
    return "https://scola.fr";
  }
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
  const pathname = request.nextUrl.pathname;
  const host = normalizeHostname(
    request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.hostname,
  );

  if (pathname === "/connexion" && !isPlatformHostname(host)) {
    return NextResponse.redirect(new URL("/connexion", platformAppOriginFromEnv()));
  }

  if (pathname.startsWith("/sign-in") && !isPlatformHostname(host)) {
    const redirectTarget = request.nextUrl.searchParams.get("redirect_url") ?? "";
    if (redirectTarget.includes("/plateforme")) {
      const dest = new URL("/sign-in", platformAppOriginFromEnv());
      dest.searchParams.set("redirect_url", "/plateforme");
      return NextResponse.redirect(dest);
    }
  }

  if (
    (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) &&
    !isPlatformTenantSlug(tenant.slug)
  ) {
    const canonicalRedirect = redirectToTenantCanonicalHost(request, tenant, host);
    if (canonicalRedirect) return withTenantHeaders(canonicalRedirect, tenant);
  }

  if (isPublicRoute(request)) { return withTenantHeaders(NextResponse.next(), tenant)}

  let authState: ProxyAuthState;
  if (isMultiTenantEnabled()) {
    let tenantSession: { userId: string } | null = null;
    try {
      tenantSession = await resolveTenantSessionFromRequest(request, tenant);
    } catch (error) {
      console.error("[proxy] resolveTenantSessionFromRequest", error);
    }
    if (!tenantSession) {
      if (pathname.startsWith("/api/")) {
        return withTenantHeaders(
          NextResponse.json({ error: "Non autorisé.", code: "AUTH_REQUIRED" }, { status: 401 }),
          tenant,
        );
      }
      return withTenantHeaders(
        NextResponse.redirect(new URL(clerkSignInPageUrl(tenant, host))),
        tenant,
      );
    }
    authState = { userId: tenantSession.userId, orgRole: null, sessionClaims: undefined };
  } else {
    const protectedAuth = await auth.protect();
    authState = {
      userId: protectedAuth.userId,
      orgRole: protectedAuth.orgRole,
      sessionClaims: protectedAuth.sessionClaims,
    };
  }

  const { roles, publicMetadata } = await resolveIntranetRolesForProxy(
    authState,
    tenant,
    request.nextUrl.hostname,
  );
  const isOrgAdmin = isOrgAdminFromSession(authState.orgRole, publicMetadata);

  const canonicalRedirect = redirectToTenantCanonicalHost(request, tenant, host);
  if (canonicalRedirect) return withTenantHeaders(canonicalRedirect, tenant);

  if (isPlatformHostname(host) && pathname === "/dashboard") {
    const dest = hasMasterRole(roles) ? "/plateforme" : "/";
    return NextResponse.redirect(new URL(dest, request.url));
  }

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
    const keys = clerkKeysFromEnv();
    if (keys) {
      return keys;
    }
    try {
      return resolveClerkKeysForHostname(request.nextUrl.hostname, platformTenantFromEnv());
    } catch {
      const fallback = defaultTenantFromEnv();
      return resolveClerkKeysForHostname(request.nextUrl.hostname, fallback);
    }
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

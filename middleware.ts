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
  clerkKeysFromEnvOverride,
  resolveClerkPublishableKey,
  resolveClerkSecretKey,
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

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/portes-ouvertes',
  '/api/travels/ingest-from-email',
  '/api/news/get',
  '/api/news/image-proxy',
  '/api/site/public',
  '/api/supplies/send',
  '/api/chatbot',
  '/api/requests/create',
  '/api/requests/confirm',
  '/api/personnel/signatures/public',
  '/api/tenant/public',
  '/demande/merci',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/chatbot(.*)',
  '/portesouvertes(.*)',
  '/simulateurTarifs(.*)',
  '/simulateurFournitures(.*)',
  '/simulateurFournituresEcoleCollegeLycee(.*)',
  '/articles/(.*)',
  '/drafts/(.*)',
  '/ecole(.*)',
  '/college(.*)',
  '/lycee(.*)',
  '/internat(.*)',
  '/projet-educatif(.*)',
  '/notre-identite(.*)',
]);

const isDev = process.env.NODE_ENV !== "production";

const ContentSecurityPolicy = `
  default-src 'self' https://login.microsoftonline.com/;
  frame-src 'self' https://www.google.com/maps/ https://maps.google.com/; 
  connect-src 'self' 
    https://*.s3.eu-west-3.amazonaws.com 
    https://*.s3.amazonaws.com 
    https://docslapro.s3.eu-west-3.amazonaws.com 
    https://docslaproimage.s3.eu-west-3.amazonaws.com 
    https://clerk-telemetry.com 
    https://*.clerk-telemetry.com 
    https://api.stripe.com 
    https://maps.googleapis.com 
    https://clerk.docslapro.com 
    https://www.googleapis.com 
    https://accounts.docslapro.com 
    genuine-wildcat-70.clerk.accounts.dev 
    https://login.microsoftonline.com 
    https://graph.microsoft.com;
  worker-src 'self' blob:;
  form-action 'self' https://*.s3.eu-west-3.amazonaws.com https://docslapro.s3.eu-west-3.amazonaws.com;
  img-src 'self' https://img.clerk.com https://clerk.docslapro.com https: data:;
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https:;
  style-src 'self' 'unsafe-inline' https:;
  font-src 'self' https: data:;
`;

async function resolveTenantForMiddleware(request: NextRequest): Promise<TenantConfig> {
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
  response.headers.set("Content-Security-Policy", ContentSecurityPolicy.replace(/\n/g, " "));
  return response;
}

function clerkClientForMiddleware(tenant: TenantConfig) {
  const envClerk = clerkKeysFromEnvOverride();
  const secretKey = envClerk?.secretKey
    ?? (isMultiTenantEnabled() ? tenant.clerkSecretKey : process.env.CLERK_SECRET_KEY);
  if (!secretKey?.trim()) {
    throw new Error("CLERK_SECRET_KEY manquante");
  }
  return createClerkClient({ secretKey });
}

type MiddlewareAuthState = {
  userId: string;
  orgRole?: string | null;
  sessionClaims: unknown;
};

async function resolveIntranetRolesForMiddleware(
  authState: MiddlewareAuthState,
  tenant: TenantConfig,
): Promise<{ roles: string[]; publicMetadata: Record<string, unknown> | undefined }> {
  const claims = authState.sessionClaims as Record<string, unknown> | undefined;
  let publicMetadata = publicMetadataFromSessionClaims(claims);
  let roles = intranetRolesFromSessionClaims(claims);

  if (roles.length === 0 && authState.userId) {
    try {
      const user = await clerkClientForMiddleware(tenant).users.getUser(authState.userId);
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
    tenant = await resolveTenantForMiddleware(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tenant inconnu";
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return new NextResponse(message, { status: 404 });
  }
  if (isPublicRoute(request)) { return withTenantHeaders(NextResponse.next(), tenant)}
  const authState = await auth.protect();
  const { roles, publicMetadata } = await resolveIntranetRolesForMiddleware(authState, tenant);
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

async function clerkKeysForTenant(request: NextRequest) {
  try {
    const tenant = await resolveTenantForMiddleware(request);
    return {
      publishableKey: resolveClerkPublishableKey(tenant.clerkPublishableKey),
      secretKey: resolveClerkSecretKey(tenant.clerkSecretKey),
    };
  } catch {
    const fallback = defaultTenantFromEnv();
    return {
      publishableKey: fallback.clerkPublishableKey,
      secretKey: fallback.clerkSecretKey,
    };
  }
}

export default isMultiTenantEnabled()
  ? clerkMiddleware(clerkAuthHandler, clerkKeysForTenant)
  : clerkMiddleware(clerkAuthHandler);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|otf|mp4|mp3|pdf)).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};

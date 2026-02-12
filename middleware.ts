import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/travels/(.*)/devis',
  '/api/portes-ouvertes/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/portesouvertes(.*)',
  '/simulateurTarifs(.*)'
]);

const isDev = process.env.NODE_ENV !== "production";

const ContentSecurityPolicy = `
  default-src 'self' https://login.microsoftonline.com/;
  connect-src 'self' 
    https://docslapro.s3.eu-west-3.amazonaws.com 
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
  form-action 'self' https://docslapro.s3.eu-west-3.amazonaws.com;
  img-src 'self' https://img.clerk.com https://clerk.docslapro.com https:;
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https:;
  style-src 'self' 'unsafe-inline' https:;
  font-src 'self' https:;
`;

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) { await auth.protect()}
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", ContentSecurityPolicy.replace(/\n/g, " "));
  return response;
});

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)', '/', '/(api|trpc)(.*)']};
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/portes-ouvertes',
  '/api/travels/ingest-from-email',
  '/api/news/get',
  '/api/news/image-proxy',
  '/api/supplies/send',
  '/api/chatbot',
  '/api/requests/create',
  '/api/requests/confirm',
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
  '/notre-identite(.*)',
]);

const isDev = process.env.NODE_ENV !== "production";

const ContentSecurityPolicy = `
  default-src 'self' https://login.microsoftonline.com/;
  frame-src 'self' https://www.google.com/maps/ https://maps.google.com/; 
  connect-src 'self' 
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
  form-action 'self' https://docslapro.s3.eu-west-3.amazonaws.com;
  img-src 'self' https://img.clerk.com https://clerk.docslapro.com https: data:;
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https:;
  style-src 'self' 'unsafe-inline' https:;
  font-src 'self' https: data:;
`;

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", ContentSecurityPolicy.replace(/\n/g, " "));
    return response;
  }
  await auth.protect();
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", ContentSecurityPolicy.replace(/\n/g, " "));
  return response;
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|otf|mp4|mp3|pdf)).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};;
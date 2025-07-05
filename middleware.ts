import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ContentSecurityPolicy = `
  default-src 'self';
  connect-src 'self' https://docslapro.s3.eu-west-3.amazonaws.com https://clerk-telemetry.com https://*.clerk-telemetry.com https://api.stripe.com https://maps.googleapis.com genuine-wildcat-70.clerk.accounts.dev;
  form-action 'self' https://docslapro.s3.eu-west-3.amazonaws.com;
  img-src 'self' https://img.clerk.com  https:;
  script-src 'self' 'unsafe-inline' https:;
  style-src 'self' 'unsafe-inline' https:;
  font-src 'self' https:;
`;

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set(
    "Content-Security-Policy",
    ContentSecurityPolicy.replace(/\n/g, "")
  );
  return response;
}
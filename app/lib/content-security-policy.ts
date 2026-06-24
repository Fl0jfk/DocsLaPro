import { SCOLA_IMAGE_CDN_HOST } from "@/app/lib/scola-image";

const isDev = process.env.NODE_ENV !== "production";

/** CSP partagée entre next.config.ts (assets statiques) et proxy.ts (pages dynamiques). */
export function contentSecurityPolicyHeaderValue(): string {
  return `
  default-src 'self' https://login.microsoftonline.com/;
  frame-src 'self' https://www.google.com/maps/ https://maps.google.com/;
  connect-src 'self'
    https://*.s3.eu-west-3.amazonaws.com
    https://*.s3.amazonaws.com
    https://docslapro.s3.eu-west-3.amazonaws.com
    https://${SCOLA_IMAGE_CDN_HOST}
    https://clerk-telemetry.com
    https://*.clerk-telemetry.com
    https://api.stripe.com
    https://maps.googleapis.com
    https://clerk.docslapro.com
    https://accounts.docslapro.com
    https://clerk.lp.docslapro.com
    https://accounts.lp.docslapro.com
    https://www.googleapis.com
    genuine-wildcat-70.clerk.accounts.dev
    https://login.microsoftonline.com
    https://graph.microsoft.com;
  worker-src 'self' blob:;
  form-action 'self' https://*.s3.eu-west-3.amazonaws.com https://docslapro.s3.eu-west-3.amazonaws.com;
  img-src 'self' https://img.clerk.com https://clerk.docslapro.com https://clerk.lp.docslapro.com https: data:;
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https:;
  style-src 'self' 'unsafe-inline' https:;
  font-src 'self' https: data:;
`
    .replace(/\s+/g, " ")
    .trim();
}

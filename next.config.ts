import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const ContentSecurityPolicy = `
  default-src 'self' https://login.microsoftonline.com/;
  connect-src 'self' https://docslapro.s3.eu-west-3.amazonaws.com https://clerk-telemetry.com https://*.clerk-telemetry.com https://api.stripe.com https://maps.googleapis.com genuine-wildcat-70.clerk.accounts.dev https://login.microsoftonline.com https://graph.microsoft.com;
  worker-src 'self' blob:;
  form-action 'self' https://docslapro.s3.eu-west-3.amazonaws.com;
  img-src 'self' https://img.clerk.com  https:;
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https:;
  style-src 'self' 'unsafe-inline' https:;
  font-src 'self' https:;
`;

const nextConfig: NextConfig = {
  images: {
    formats : ['image/webp'],
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'docslapro.s3.eu-west-3.amazonaws.com',
            pathname: '/**',
        },
        {
            protocol: 'https',
            hostname: 'docslaproimage.s3.eu-west-3.amazonaws.com',
            pathname: '/**',
        }
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
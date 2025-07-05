import type { NextConfig } from "next";

const ContentSecurityPolicy = `
  default-src 'self';
  connect-src 'self' https://docslapro.s3.eu-west-3.amazonaws.com https://clerk-telemetry.com https://api.clerk.dev https://clerk.dev;
  img-src 'self' https://img.clerk.com;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
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
            hostname: 'docslapro.s3.eu-west-3.amazonaws.com/tutos/*',
            pathname: '/**',
        },
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
import type { NextConfig } from "next";
import { contentSecurityPolicyHeaderValue, crossOriginOpenerPolicyHeaderValue } from "./app/lib/content-security-policy";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
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
            hostname: 'scola-image.s3.eu-west-3.amazonaws.com',
            pathname: '/**',
        },
        {
            protocol: 'https',
            hostname: 'flagcdn.com',
            pathname: '/**',
        },
        {
            protocol: 'https',
            hostname: 'images.unsplash.com',
            pathname: '/**',
        }
    ]
  },
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: contentSecurityPolicyHeaderValue(),
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: crossOriginOpenerPolicyHeaderValue(),
      },
    ];
    return [
      {
        // Pas de CSP sur les flux binaires : le lecteur PDF intégré de Chrome plante sinon.
        source: "/((?!api/rentree/file)(?!api/fournitures/file)(?!documents/rentree/).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
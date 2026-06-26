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
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicyHeaderValue(),
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: crossOriginOpenerPolicyHeaderValue(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
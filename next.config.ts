import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats : ['image/webp'],
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'docslapro.s3.eu-west-3.amazonaws.com',
            pathname: '/**',
        },
    ]
}
};

export default nextConfig;

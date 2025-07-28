import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
      {
        source: '/verify',
        destination: '/auth/verify',
        permanent: true,
      },
      {
        source: '/forgot-password',
        destination: '/auth/forgot-password',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

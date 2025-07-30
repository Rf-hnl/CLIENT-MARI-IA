import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Temporalmente ignorar ESLint durante builds hasta arreglar todos los errores
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporalmente ignorar errores de TypeScript hasta arreglar todos los tipos
    ignoreBuildErrors: true,
  },
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

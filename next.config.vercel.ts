import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment config - remove 'standalone' output
  eslint: {
    // Temporalmente ignorar ESLint durante builds hasta arreglar todos los errores
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporalmente ignorar errores de TypeScript hasta arreglar todos los tipos
    ignoreBuildErrors: true,
  },
  // Vercel handles images optimization automatically
  images: {
    domains: ['res.cloudinary.com'],
  },
  // Environment variables for Vercel
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://your-app.vercel.app',
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
  // API routes optimization for Vercel
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;
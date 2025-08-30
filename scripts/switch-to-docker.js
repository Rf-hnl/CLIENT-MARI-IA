#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🐳 Switching configuration for Docker/Azure deployment...');

// Restore original next.config.ts
const originalConfig = path.join(__dirname, '../next.config.ts');
const backupConfig = path.join(__dirname, '../next.config.docker.ts');

if (fs.existsSync(backupConfig)) {
  fs.copyFileSync(backupConfig, originalConfig);
  console.log('✅ Restored Docker configuration');
} else {
  console.error('❌ next.config.docker.ts backup not found!');
  console.log('Creating default Docker configuration...');
  
  const dockerConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
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

export default nextConfig;`;
  
  fs.writeFileSync(originalConfig, dockerConfig);
  console.log('✅ Created default Docker configuration');
}

console.log('');
console.log('🎉 Configuration switched to Docker/Azure!');
console.log('');
console.log('Next steps:');
console.log('1. Build Docker image: docker build -t client-mar-ia .');
console.log('2. Deploy with Azure Pipelines');
console.log('3. Use "npm run switch:vercel" to switch back to Vercel config');
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Switching configuration for Vercel deployment...');

// Backup original next.config.ts
const originalConfig = path.join(__dirname, '../next.config.ts');
const backupConfig = path.join(__dirname, '../next.config.docker.ts');

if (fs.existsSync(originalConfig)) {
  fs.copyFileSync(originalConfig, backupConfig);
  console.log('✅ Backed up original next.config.ts to next.config.docker.ts');
}

// Switch to Vercel config
const vercelConfig = path.join(__dirname, '../next.config.vercel.ts');
if (fs.existsSync(vercelConfig)) {
  fs.copyFileSync(vercelConfig, originalConfig);
  console.log('✅ Switched to Vercel configuration');
} else {
  console.error('❌ next.config.vercel.ts not found!');
  process.exit(1);
}

// Update package.json scripts for Vercel
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add Vercel-specific scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "build:vercel": "next build",
  "postinstall": "prisma generate",
  "type-check": "tsc --noEmit",
  "switch:vercel": "node scripts/switch-to-vercel.js",
  "switch:docker": "node scripts/switch-to-docker.js"
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with Vercel scripts');

console.log('');
console.log('🎉 Configuration switched to Vercel!');
console.log('');
console.log('Next steps:');
console.log('1. Set up environment variables in Vercel dashboard');
console.log('2. Connect your database (PostgreSQL recommended)');
console.log('3. Deploy with: vercel --prod');
console.log('4. Use "npm run switch:docker" to switch back to Docker config');
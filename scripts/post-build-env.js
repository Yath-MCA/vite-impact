#!/usr/bin/env node

/**
 * Post-Build Environment Script
 * 
 * Copies env.js to dist folder after build
 * Ensures environment config is available in production builds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const publicEnvPath = path.join(ROOT_DIR, 'public', 'env.js');
const distEnvPath = path.join(ROOT_DIR, 'dist', 'env.js');

console.log('📦 Post-build: Copying env.js to dist...');

if (!fs.existsSync(publicEnvPath)) {
  console.error('❌ env.js not found in public folder');
  console.error('   Run: npm run env:<environment> first');
  process.exit(1);
}

if (!fs.existsSync(path.dirname(distEnvPath))) {
  console.error('❌ dist folder not found');
  console.error('   Run: npm run build first');
  process.exit(1);
}

try {
  fs.copyFileSync(publicEnvPath, distEnvPath);
  console.log('✅ env.js copied to dist folder');
} catch (err) {
  console.error('❌ Failed to copy env.js:', err.message);
  process.exit(1);
}

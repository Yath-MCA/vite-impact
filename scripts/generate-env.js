#!/usr/bin/env node

/**
 * Environment Configuration Generator
 * 
 * Generates runtime env.js file with window.ENV configuration
 * Supports: local, dev, uat, stage, prod
 * 
 * Usage:
 *   node scripts/generate-env.js [environment]
 *   ENV_NAME=prod node scripts/generate-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { validateEnvConfig, ENVIRONMENTS } from '../env/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Get environment from argument or ENV_NAME variable
const envName = process.argv[2] || process.env.ENV_NAME || 'local';

// Validate environment
if (!Object.values(ENVIRONMENTS).includes(envName)) {
  console.error(`❌ Invalid environment: ${envName}`);
  console.error(`   Valid environments: ${Object.values(ENVIRONMENTS).join(', ')}`);
  process.exit(1);
}

console.log(`🔧 Generating environment config for: ${envName.toUpperCase()}`);

// Load package.json for version info
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
} catch (err) {
  console.error('❌ Failed to read package.json:', err.message);
  process.exit(1);
}

// Load environment config
const envFilePath = path.join(ROOT_DIR, 'env', `env.${envName}.js`);
let envConfig;

try {
  const envModule = await import(`file://${envFilePath}`);
  envConfig = envModule.default;
} catch (err) {
  console.error(`❌ Failed to load environment config: ${envFilePath}`);
  console.error('   Error:', err.message);
  process.exit(1);
}

// Load secrets overlay (git-ignored — safe from AI agents and version control)
// File: env/env.{name}.secrets.js  →  merges/overrides keys in the base config
const secretsFilePath = path.join(ROOT_DIR, 'env', `env.${envName}.secrets.js`);
try {
  const secretsModule = await import(`file://${secretsFilePath}`);
  const secrets = secretsModule.default || {};
  // Deep merge: secrets overlay wins over base config
  envConfig = {
    ...envConfig,
    ...secrets,
    // Keep FEATURE_FLAGS merged, not replaced
    FEATURE_FLAGS: {
      ...(envConfig.FEATURE_FLAGS || {}),
      ...(secrets.FEATURE_FLAGS || {})
    }
  };
  console.log(`🔐 Secrets overlay loaded: env.${envName}.secrets.js`);
} catch {
  // Secrets file is optional — silently skip if missing
  // (CI/CD environments inject secrets via OS env vars instead)
}

// Get git info
function getGitInfo() {
  try {
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: ROOT_DIR }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', cwd: ROOT_DIR }).trim();
    return { commit, branch };
  } catch {
    return { commit: 'unknown', branch: 'unknown' };
  }
}

const gitInfo = getGitInfo();
const timestamp = new Date().toISOString();
const version = packageJson.version || '1.0.0';
const baseVersion = version.split('.').slice(0, 2).join('.');

// Process feature flags with environment overrides
const featureFlags = { ...envConfig.FEATURE_FLAGS };

// Override from environment variables
Object.keys(featureFlags).forEach(flag => {
  const envVar = process.env[`FEATURE_${flag}`];
  if (envVar !== undefined) {
    featureFlags[flag] = envVar === 'true' || envVar === '1';
  }
});

// Build the final ENV object
const finalEnv = {
  // Build metadata
  VERSION: version,
  TIMESTAMP: timestamp,
  BASE_VERSION: baseVersion,
  BUILD_HASH: gitInfo.commit,
  GIT_BRANCH: gitInfo.branch,
  ENVIRONMENT: envName,

  // App configuration
  APP_KEY: envConfig.APP_KEY,

  // Feature flags
  FEATURE_FLAGS: featureFlags,

  // API configuration
  API_KEY: envConfig.API_KEY,
  User_API_KEY: envConfig.User_API_KEY,
  API_PATH: envConfig.API_PATH,

  // Domain detection
  IS_LIVE_DOMAIN: envConfig.IS_LIVE_DOMAIN,
  IS_UAT_DOMAIN: envConfig.IS_UAT_DOMAIN,
  IS_DEV_DOMAIN: envConfig.IS_DEV_DOMAIN,

  // Domain configuration
  DOMAIN: envConfig.DOMAIN,
  DOMAIN_ROOT: envConfig.DOMAIN_ROOT,
  BACKEND_DOMAIN: envConfig.BACKEND_DOMAIN,
  BUCKET_URL: envConfig.BUCKET_URL,

  // Debugging
  DEBUG: envConfig.DEBUG,
  LOG_LEVEL: envConfig.LOG_LEVEL,

  // Third-party services
  SPELLCHECK_HOST: envConfig.SPELLCHECK_HOST,
  KIT_CLOSE_TASK_URL: envConfig.KIT_CLOSE_TASK_URL,
  KIT_CLOSE_TASK_TOKEN: envConfig.KIT_CLOSE_TASK_TOKEN,

  // Supabase configuration
  VITE_SUPABASE_URL: envConfig.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: envConfig.VITE_SUPABASE_ANON_KEY
};

// Validate configuration
const validation = validateEnvConfig(finalEnv, envName);
if (!validation.valid) {
  console.error('❌ Environment validation failed:');
  validation.errors.forEach(err => console.error(`   • ${err}`));

  // In production, fail the build
  if (envName === ENVIRONMENTS.PROD) {
    process.exit(1);
  }
}

// Security checks for production
if (envName === ENVIRONMENTS.PROD) {
  const sensitiveFields = ['API_KEY', 'User_API_KEY', 'KIT_CLOSE_TASK_TOKEN'];
  const missingSecrets = sensitiveFields.filter(field => !finalEnv[field] || finalEnv[field].includes('placeholder'));

  if (missingSecrets.length > 0) {
    console.error('❌ Production build missing required secrets:');
    missingSecrets.forEach(field => console.error(`   • ${field}`));
    console.error('\n⚠️  Set these via environment variables before building.');
    process.exit(1);
  }
}

// Generate env.js content
const envJsContent = `/**
 * Runtime Environment Configuration
 * Auto-generated: ${timestamp}
 * Environment: ${envName}
 * Version: ${version}
 * Git Commit: ${gitInfo.commit}
 * Branch: ${gitInfo.branch}
 * 
 * DO NOT EDIT THIS FILE DIRECTLY
 * It is auto-generated during the build process
 */

(function() {
  'use strict';
  
  window.ENV = ${JSON.stringify(finalEnv, null, 2)};
  
  // Freeze to prevent modifications
  if (Object.freeze) {
    Object.freeze(window.ENV);
    Object.freeze(window.ENV.FEATURE_FLAGS);
  }
  
  // Console output for debugging
  if (window.ENV.DEBUG) {
    console.log('[ENV] Runtime configuration loaded:', window.ENV.ENVIRONMENT);
    console.log('[ENV] Version:', window.ENV.VERSION);
    console.log('[ENV] Build:', window.ENV.BUILD_HASH);
  }
})();
`;

// Determine output path
const outputDir = process.env.ENV_OUTPUT_DIR || path.join(ROOT_DIR, 'public');
const outputFile = path.join(outputDir, 'env.js');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write file
fs.writeFileSync(outputFile, envJsContent, 'utf8');

console.log('✅ Environment configuration generated:');
console.log(`   File: ${outputFile}`);
console.log(`   Environment: ${envName}`);
console.log(`   Version: ${version}`);
console.log(`   Build: ${gitInfo.commit}`);
console.log(`   Timestamp: ${timestamp}`);

if (validation.errors.length > 0) {
  console.warn('\n⚠️  Validation warnings:');
  validation.errors.forEach(err => console.warn(`   • ${err}`));
}

// Copy to dist if it exists (for post-build)
const distDir = path.join(ROOT_DIR, 'dist');
if (fs.existsSync(distDir)) {
  const distFile = path.join(distDir, 'env.js');
  fs.copyFileSync(outputFile, distFile);
  console.log(`   Copied to: ${distFile}`);
}

console.log('\n✨ Done!');

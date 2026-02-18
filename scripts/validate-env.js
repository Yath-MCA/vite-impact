#!/usr/bin/env node

/**
 * Environment Validation Script
 * 
 * Validates environment configuration without generating files
 * Useful for CI/CD pipelines
 * 
 * Usage:
 *   node scripts/validate-env.js [environment]
 *   ENV_NAME=prod npm run env:validate
 */

import { validateEnvConfig, ENVIRONMENTS } from '../env/schema.js';

const envName = process.argv[2] || process.env.ENV_NAME || 'local';

console.log(`🔍 Validating environment: ${envName.toUpperCase()}`);

if (!Object.values(ENVIRONMENTS).includes(envName)) {
  console.error(`❌ Invalid environment: ${envName}`);
  process.exit(1);
}

try {
  const envModule = await import(`file://${process.cwd()}/env/env.${envName}.js`);
  const envConfig = envModule.default;
  
  const validation = validateEnvConfig(envConfig, envName);
  
  if (!validation.valid) {
    console.error('❌ Validation failed:');
    validation.errors.forEach(err => console.error(`   • ${err}`));
    process.exit(1);
  }
  
  console.log('✅ Environment configuration is valid');
  
  // Show configuration summary
  console.log('\n📋 Configuration Summary:');
  console.log(`   Environment: ${envName}`);
  console.log(`   Domain: ${envConfig.DOMAIN}`);
  console.log(`   Backend: ${envConfig.BACKEND_DOMAIN}`);
  console.log(`   Debug: ${envConfig.DEBUG}`);
  console.log(`   Features: ${Object.keys(envConfig.FEATURE_FLAGS || {}).join(', ')}`);
  
  process.exit(0);
} catch (err) {
  console.error(`❌ Failed to load environment config: ${err.message}`);
  process.exit(1);
}

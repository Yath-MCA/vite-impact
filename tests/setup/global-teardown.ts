import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * Runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('Starting global teardown...');
  
  // Clean up resources
  console.log('Global teardown complete');
}

export default globalTeardown;

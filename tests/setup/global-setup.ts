import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('Starting global setup...');
  
  // Set up environment variables for tests
  process.env.TEST_ENV = 'e2e';
  process.env.NODE_ENV = 'test';
  
  // Clean up any previous test artifacts
  console.log('Global setup complete');
}

export default globalSetup;

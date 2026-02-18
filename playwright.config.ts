import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for React 18 + Vite Overlay System
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video recording */
    video: 'retain-on-failure',

    /* Action timeout */
    actionTimeout: 10000,

    /* Navigation timeout */
    navigationTimeout: 30000,

    /* Viewport */
    viewport: { width: 1280, height: 720 },

    /* Locale and timezone */
    locale: 'en-US',
    timezoneId: 'America/New_York',

    /* Permissions */
    permissions: ['clipboard-read', 'clipboard-write']
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security']
        }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
      },
    },

    /* Test against mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  /* Global setup and teardown */
  // Note: Using ES modules, setup files need to be handled differently
  // globalSetup: './tests/setup/global-setup.ts',
  // globalTeardown: './tests/setup/global-teardown.ts',

  /* Output directory for test artifacts */
  outputDir: 'test-results/',

  /* Test match patterns */
  testMatch: /.*\.spec\.ts/,
});

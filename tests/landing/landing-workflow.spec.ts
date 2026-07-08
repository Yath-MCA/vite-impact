import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';
import {
  TEST_VALIDATE_KEY,
  clearLandingStorage,
  mockLinkShareSessionGrant,
  mockUrlValiditySuccess
} from '../helpers/landing-api-mocks';

test.describe('ValidateUrl and landing workflows', () => {
  test.beforeEach(async ({ page }) => {
    await clearLandingStorage(page);
  });

  test('marketing landing renders at root', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /modern review and approval/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /login/i }).first()).toBeVisible();
  });

  test('validateurl without key shows validation error', async ({ page }) => {
    await page.goto('/validateurl');
    await expect(page.getByText('Validation Failed')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/no validation key/i)).toBeVisible();
  });

  test('validateurl success shows landing instructions and agree button', async ({ page }) => {
    await mockUrlValiditySuccess(page);

    const landing = new LandingPage(page);
    await landing.gotoValidateUrl(TEST_VALIDATE_KEY);

    await landing.waitForLandingPanel();
    await expect(page.getByText('E2E Test Article')).toBeVisible();
    await expect(landing.agreeButton).toBeVisible();
  });

  test('agree and continue starts session check', async ({ page }) => {
    await mockUrlValiditySuccess(page);
    await mockLinkShareSessionGrant(page);

    const landing = new LandingPage(page);
    await landing.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landing.waitForLandingPanel();

    const linkSharePromise = page.waitForRequest((req) =>
      req.url().includes('linksharing') && req.method() === 'POST'
    );

    await landing.agreeButton.click();
    const linkShareRequest = await linkSharePromise;
    expect(linkShareRequest.url()).toContain('linksharing');
  });

  test('multi-user email cancel shows validate email button', async ({ page }) => {
    await mockUrlValiditySuccess(page, {
      emailto: ['author@example.com', 'collab@example.com'],
      status: 'active'
    });

    const landing = new LandingPage(page);
    await landing.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landing.waitForLandingPanel();

    await expect(page.getByText('Validate user')).toBeVisible({ timeout: 10000 });
    await page.locator('.swal2-cancel').click();

    await expect(landing.validateEmailButton).toBeVisible();
    await expect(landing.agreeButton).not.toBeVisible();
  });

  test('multi-user valid email auto-starts session for non-PLOS client', async ({ page }) => {
    await mockUrlValiditySuccess(page, {
      emailto: ['author@example.com', 'collab@example.com'],
      status: 'active',
      client: 'oup'
    });
    await mockLinkShareSessionGrant(page);

    const landing = new LandingPage(page);
    await landing.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landing.waitForLandingPanel();

    await expect(page.getByText('Validate user')).toBeVisible({ timeout: 10000 });
    await page.locator('.swal2-input').fill('collab@example.com');
    await page.locator('.swal2-confirm').click();

    await page.waitForRequest((req) =>
      req.url().includes('linksharing') && req.method() === 'POST'
    , { timeout: 15000 });
  });

  test('tab visibility revalidation keeps accept button without re-prompting', async ({ page }) => {
    await mockUrlValiditySuccess(page);

    const landing = new LandingPage(page);
    await landing.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landing.waitForLandingPanel();
    await expect(landing.agreeButton).toBeVisible();

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(landing.agreeButton).not.toBeVisible();

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await expect(page.getByText('Validate user')).not.toBeVisible({ timeout: 3000 });
    await expect(landing.agreeButton).toBeVisible({ timeout: 10000 });
  });
});

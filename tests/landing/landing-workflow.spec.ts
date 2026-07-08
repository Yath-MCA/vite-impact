import { test, expect } from '../fixtures/test-fixtures';
import {
  TEST_VALIDATE_KEY,
  defaultValidatePayload,
  mockLinkShareBlocked,
  mockLinkShareDenied,
  mockLinkShareSessionGrant,
  mockPlosCaptchaSuccess,
  mockUrlValidityFailure,
  mockUrlValidityIpDenied,
  mockUrlValiditySuccess,
  seedDuplicateTabLock,
  stubRecaptchaEnterprise,
  trackUrlValidityCalls
} from '../helpers/landing-api-mocks';

test.describe('ValidateUrl and landing workflows', () => {
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

  test('validateurl success shows landing instructions and agree button', async ({
    landingPage,
    page
  }) => {
    await mockUrlValiditySuccess(page);

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landingPage.waitForLandingPanel();

    await expect(page.getByText('E2E Test Article')).toBeVisible();
    await landingPage.assertAgreeVisible();
  });

  test('idle_session_log_out alert shows session ended dialog then validates', async ({
    landingPage,
    page
  }) => {
    await mockUrlValiditySuccess(page);

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY, { alert: 'idle_session_log_out' });
    await landingPage.waitForSwal(/session ended/i);
    await expect(landingPage.swalPopup).toContainText(/inactivity/i);
    await expect(landingPage.swalPopup).toContainText(/AGREE & CONTINUE/i);
    await landingPage.confirmSwal();
    await landingPage.waitForLandingPanel();

    await expect(page.getByText('E2E Test Article')).toBeVisible();
    await landingPage.assertAgreeVisible();
  });

  test('expired link shows validation failed', async ({ page }) => {
    await mockUrlValidityFailure(page, { status: 'expired' });

    await page.goto(`/validateurl?key=${TEST_VALIDATE_KEY}`);
    await expect(page.getByText('Validation Failed')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/expired/i)).toBeVisible();
  });

  test('access denied link shows validation failed', async ({ page }) => {
    await mockUrlValidityFailure(page, { r: 0 });

    await page.goto(`/validateurl?key=${TEST_VALIDATE_KEY}`);
    await expect(page.getByText('Validation Failed')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/access denied/i)).toBeVisible();
  });

  test('duplicate tab shows link opened error', async ({ page }) => {
    await mockUrlValiditySuccess(page);
    await seedDuplicateTabLock(page);

    await page.goto(`/validateurl?key=${TEST_VALIDATE_KEY}`);
    await expect(page.getByText('Validation Failed')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/already opened in another tab/i).first()).toBeVisible();
  });

  test('agree and continue starts session check', async ({ landingPage, page }) => {
    await mockUrlValiditySuccess(page);
    await mockLinkShareSessionGrant(page);

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landingPage.waitForLandingPanel();

    const checkPromise = landingPage.waitForLinkShareCheck();
    await landingPage.agreeButton.click();
    const payload = await checkPromise;

    expect(String(payload.process)).toBe('check');
  });

  test('full grant redirects to editor', async ({ landingPage, page }) => {
    await mockUrlValiditySuccess(page);
    await mockLinkShareSessionGrant(page);

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landingPage.waitForLandingPanel();
    await landingPage.agreeButton.click();

    await expect(page).toHaveURL(/\/editor/, { timeout: 20000 });
  });

  test('blocked session shows send request dialog', async ({ landingPage, page }) => {
    await mockUrlValiditySuccess(page);
    await mockLinkShareBlocked(page);

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landingPage.waitForLandingPanel();
    await landingPage.agreeButton.click();

    await landingPage.waitForSwal(/send request/i);
    await expect(page.getByRole('button', { name: /send request/i })).toBeVisible();
  });

  test('denied session shows access denied dialog', async ({ landingPage, page }) => {
    await mockUrlValiditySuccess(page);
    await mockLinkShareDenied(page);

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landingPage.waitForLandingPanel();
    await landingPage.agreeButton.click();

    await landingPage.waitForSwal(/request denied/i);
  });

  test('multi-user email cancel shows validate email button', async ({ landingPage, page }) => {
    await mockUrlValiditySuccess(page, {
      emailto: ['author@example.com', 'collab@example.com'],
      status: 'active'
    });

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landingPage.waitForLandingPanel();

    if (await landingPage.swalPopup.isVisible().catch(() => false)) {
      await landingPage.cancelSwal();
    }

    await expect(landingPage.validateEmailButton).toBeVisible({ timeout: 10000 });
    await landingPage.assertAgreeHidden();
  });

  test('multi-user invalid email keeps swal open', async ({ landingPage, page }) => {
    await mockUrlValiditySuccess(page, {
      emailto: ['author@example.com', 'collab@example.com'],
      status: 'active'
    });

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landingPage.ensureMultiUserEmailPrompt();

    await landingPage.fillSwalEmail('unknown@example.com');
    await landingPage.confirmSwal();

    await expect(landingPage.swalPopup).toContainText(/not valid/i);
    await landingPage.assertAgreeHidden();
  });

  test('validate email button re-opens swal prompt', async ({ landingPage, page }) => {
    await mockUrlValiditySuccess(page, {
      emailto: ['author@example.com', 'collab@example.com'],
      status: 'active'
    });

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landingPage.waitForLandingPanel();

    if (await landingPage.swalPopup.isVisible().catch(() => false)) {
      await landingPage.cancelSwal();
    } else {
      await expect(landingPage.validateEmailButton).toBeVisible();
    }

    await landingPage.validateEmailButton.click();
    await landingPage.waitForMultiUserEmailPrompt();
  });

  test('multi-user valid email auto-starts session with remarks', async ({
    landingPage,
    page
  }) => {
    await mockUrlValiditySuccess(page, {
      emailto: ['author@example.com', 'collab@example.com'],
      status: 'active',
      client: 'oup'
    });
    await mockLinkShareSessionGrant(page);

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landingPage.ensureMultiUserEmailPrompt();
    await landingPage.fillSwalEmail('collab@example.com');

    const checkPromise = landingPage.waitForLinkShareCheck();
    await landingPage.confirmSwal();
    const payload = await checkPromise;

    expect(payload.remarks).toBe('user_enter_valid_email');
    expect(payload.username).toBe('collab@example.com');
  });

  test('tab visibility revalidation keeps accept button without re-prompting', async ({
    landingPage,
    page
  }) => {
    await mockUrlValiditySuccess(page);

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landingPage.waitForLandingPanel();
    await landingPage.assertAgreeVisible();

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await landingPage.assertAgreeHidden();

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await expect(page.getByText('Validate user')).not.toBeVisible({ timeout: 3000 });
    await landingPage.assertAgreeVisible();
  });

  test('accept button hides after TTL expires', async ({ landingPage, page }) => {
    await mockUrlValiditySuccess(page);
    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY, { acceptTtlMs: '2000' });
    await landingPage.waitForLandingPanel();
    await landingPage.assertAgreeVisible();

    await page.waitForTimeout(2500);
    await landingPage.assertAgreeHidden();
  });

  test('plos captcha pass shows agree button', async ({ landingPage, page }) => {
    await stubRecaptchaEnterprise(page);
    await mockPlosCaptchaSuccess(page);
    await mockUrlValiditySuccess(page, { client: 'plos' });

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landingPage.waitForLandingPanel();
    await landingPage.assertAgreeVisible();
  });

  test('plos otp cancel shows retry verification', async ({ landingPage, page }) => {
    await mockUrlValiditySuccess(page, { client: 'plos', r: 2 }, { r: 2 });

    await landingPage.gotoValidateUrl(TEST_VALIDATE_KEY);
    await landingPage.waitForLandingPanel();

    await landingPage.waitForSwal(/send access code/i);
    await landingPage.cancelSwal();

    await expect(landingPage.validateEmailButton).toBeVisible({ timeout: 15000 });
    await expect(landingPage.validateEmailButton).toContainText(/retry verification/i);
    await landingPage.assertAgreeHidden();
  });

  test('unsupported browser blocks validateurl without calling API', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko'
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      Object.defineProperty(document, 'documentMode', { value: 11, configurable: true });
    });

    const tracker = await trackUrlValidityCalls(page);
    await page.goto(`/validateurl?key=${TEST_VALIDATE_KEY}`);

    await expect(page.getByText('Validation Failed')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/not supported/i)).toBeVisible();
    expect(tracker.count).toBe(0);

    await context.close();
  });
});

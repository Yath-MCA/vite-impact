import { type Page, type Locator, expect } from '@playwright/test';
import { parseLinkSharePayload } from '../helpers/landing-api-mocks';

export class LandingPage {
  readonly page: Page;
  readonly agreeButton: Locator;
  readonly validateEmailButton: Locator;
  readonly continueToLandingButton: Locator;
  readonly swalPopup: Locator;
  readonly swalConfirm: Locator;
  readonly swalCancel: Locator;
  readonly swalInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.agreeButton = page.getByRole('button', { name: /agree & continue/i });
    this.validateEmailButton = page.getByRole('button', { name: /validate email|retry verification/i });
    this.continueToLandingButton = page.getByRole('button', { name: /continue to landing/i });
    this.swalPopup = page.locator('.swal2-popup');
    this.swalConfirm = page.locator('.swal2-confirm');
    this.swalCancel = page.locator('.swal2-cancel');
    this.swalInput = page.locator('.swal2-input');
  }

  async gotoValidateUrl(key: string, query: Record<string, string> = {}) {
    const params = new URLSearchParams({ key, ...query });
    await this.page.goto(`/validateurl?${params.toString()}`);
  }

  async waitForLandingPanel() {
    await expect(this.page.getByText('Instructions')).toBeVisible({ timeout: 20000 });
  }

  async waitForValidationSuccess() {
    await expect(this.page.getByText('Link Validated')).toBeVisible({ timeout: 15000 });
  }

  async openLandingFromSuccessCard() {
    await this.continueToLandingButton.click();
    await this.waitForLandingPanel();
  }

  async waitForSwal(title?: RegExp | string) {
    await expect(this.swalPopup).toBeVisible({ timeout: 10000 });
    if (title) {
      await expect(this.swalPopup).toContainText(title);
    }
  }

  async fillSwalEmail(email: string) {
    await this.swalInput.fill(email);
  }

  async confirmSwal() {
    await this.swalConfirm.click();
  }

  async cancelSwal() {
    await this.swalCancel.click();
  }

  async dismissSwalIfVisible() {
    if (await this.swalCancel.isVisible().catch(() => false)) {
      await this.swalCancel.click();
    }
  }

  async assertAgreeVisible() {
    await expect(this.agreeButton).toBeVisible();
  }

  async assertAgreeHidden() {
    await expect(this.agreeButton).not.toBeVisible();
  }

  async waitForMultiUserEmailPrompt() {
    await expect(this.page.getByRole('heading', { name: 'Validate user' })).toBeVisible({
      timeout: 20000
    });
  }

  async ensureMultiUserEmailPrompt() {
    await this.waitForLandingPanel();
    if (await this.validateEmailButton.isVisible().catch(() => false)) {
      await this.validateEmailButton.click();
    }
    await this.waitForMultiUserEmailPrompt();
  }

  async waitForLinkShareCheck() {
    const request = await this.page.waitForRequest(
      (req) => req.url().includes('linksharing') && req.method() === 'POST',
      { timeout: 15000 }
    );
    return parseLinkSharePayload(request);
  }
}

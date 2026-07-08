import { type Page, type Locator, expect } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly agreeButton: Locator;
  readonly validateEmailButton: Locator;
  readonly continueToLandingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.agreeButton = page.getByRole('button', { name: /agree & continue/i });
    this.validateEmailButton = page.getByRole('button', { name: /validate email|retry verification/i });
    this.continueToLandingButton = page.getByRole('button', { name: /continue to landing/i });
  }

  async gotoValidateUrl(key: string) {
    await this.page.goto(`/validateurl?key=${encodeURIComponent(key)}`);
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

  async dismissSwalIfVisible() {
    const cancel = this.page.locator('.swal2-cancel');
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click();
    }
  }
}

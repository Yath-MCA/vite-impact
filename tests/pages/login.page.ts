import { type Page, type Locator, expect } from '@playwright/test';
import { parseLinkSharePayload } from '../helpers/landing-api-mocks';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.getByRole('button', { name: /sign in/i });
    this.errorBanner = page.locator('.bg-red-100');
  }

  async goto() {
    await this.page.goto('/login');
    await this.assertOnLoginPage();
  }

  async assertOnLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.page.getByRole('heading', { name: 'Login' })).toBeVisible();
  }

  async assertError(text: string | RegExp) {
    await expect(this.errorBanner).toContainText(text);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

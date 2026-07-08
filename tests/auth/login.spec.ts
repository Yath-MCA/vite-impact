import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import {
  clearLandingStorage,
  mockUserLoginFailure,
  mockUserLoginSuccess
} from '../helpers/landing-api-mocks';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await clearLandingStorage(page);
  });

  test('renders login form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('shows validation error when fields are empty', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill('');
    await loginPage.passwordInput.fill('');
    await loginPage.submitButton.click();

    await expect(page.getByText('Please enter both email and password')).toBeVisible();
  });

  test('redirects to dashboard on successful login', async ({ page }) => {
    await mockUserLoginSuccess(page);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('author@example.com', 'Test123');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await mockUserLoginFailure(page);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('author@example.com', 'wrong-password');

    await expect(page.getByText('Invalid password')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

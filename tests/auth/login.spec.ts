import { test, expect } from '../fixtures/test-fixtures';
import {
  mockUserLoginFailure,
  mockUserLoginInvalidEmail,
  mockUserLoginSuccess
} from '../helpers/landing-api-mocks';

test.describe('Login page', () => {
  test('renders login form', async ({ loginPage, page }) => {
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('shows validation error when fields are empty', async ({ loginPage }) => {
    await loginPage.goto();

    await loginPage.emailInput.fill('');
    await loginPage.passwordInput.fill('');
    await loginPage.submitButton.click();

    await loginPage.assertError('Please enter both email and password');
  });

  test('redirects to dashboard on successful login', async ({ loginPage, page }) => {
    await mockUserLoginSuccess(page);

    await loginPage.goto();
    await loginPage.login('author@example.com', 'Test123');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('shows error on invalid credentials', async ({ loginPage, page }) => {
    await mockUserLoginFailure(page);

    await loginPage.goto();
    await loginPage.login('author@example.com', 'wrong-password');

    await loginPage.assertError('Invalid password');
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows error when email is invalid in API response', async ({ loginPage, page }) => {
    await mockUserLoginInvalidEmail(page);

    await loginPage.goto();
    await loginPage.login('bad@example.com', 'Test123');

    await loginPage.assertError('Invalid email');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});

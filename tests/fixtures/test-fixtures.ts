import { test as baseTest, expect, type Page, type Locator } from '@playwright/test';
import { OverlayPage } from '../pages/overlay.page';
import { LoginPage } from '../pages/login.page';
import { LandingPage } from '../pages/landing.page';
import { clearLandingStorage } from '../helpers/landing-api-mocks';

interface TestFixtures {
  overlayPage: OverlayPage;
  loginPage: LoginPage;
  landingPage: LandingPage;
}

export const test = baseTest.extend<TestFixtures>({
  overlayPage: async ({ page }, use) => {
    const overlayPage = new OverlayPage(page);
    await use(overlayPage);
  },

  loginPage: async ({ page }, use) => {
    await clearLandingStorage(page);
    await use(new LoginPage(page));
  },

  landingPage: async ({ page }, use) => {
    await clearLandingStorage(page);
    await use(new LandingPage(page));
  }
});

export { expect, type Page, type Locator };

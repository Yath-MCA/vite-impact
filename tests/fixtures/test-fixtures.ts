import { test as baseTest, expect, type Page, type Locator } from '@playwright/test';
import { OverlayPage } from '../pages/overlay.page';

/**
 * Extended test fixture with overlay page object
 */
interface TestFixtures {
  overlayPage: OverlayPage;
}

/**
 * Custom test with fixtures
 */
export const test = baseTest.extend<TestFixtures>({
  overlayPage: async ({ page }, use) => {
    const overlayPage = new OverlayPage(page);
    await use(overlayPage);
  },
});

export { expect, type Page, type Locator };

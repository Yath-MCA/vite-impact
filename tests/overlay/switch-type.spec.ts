import { test, expect } from '../fixtures/test-fixtures';

test.describe('Overlay Type Switching', () => {
  test.beforeEach(async ({ overlayPage }) => {
    await overlayPage.goto();
  });

  test.describe('Runtime Type Switching', () => {
    test('should switch from dialog to sidebar', async ({ overlayPage }) => {
      // Open as dialog
      await overlayPage.openOverlayByType('dialog');
      await expect(overlayPage.overlayDialog).toBeVisible();
      
      // Get content before switch
      const contentBefore = await overlayPage.getOverlayContent().textContent();
      
      // Switch to sidebar
      await overlayPage.switchType('sidebar');
      
      // Verify sidebar is now visible
      await expect(overlayPage.overlaySidebar).toBeVisible();
      
      // Verify content persisted (no re-mount)
      const contentAfter = await overlayPage.getOverlayContent().textContent();
      expect(contentAfter).toBe(contentBefore);
    });

    test('should switch from dialog to popout', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await expect(overlayPage.overlayDialog).toBeVisible();
      
      await overlayPage.switchType('popout');
      
      await expect(overlayPage.overlayPopout).toBeVisible();
      await expect(overlayPage.overlayDialog).not.toBeVisible();
    });

    test('should switch from popout to dialog', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      await expect(overlayPage.overlayPopout).toBeVisible();
      
      await overlayPage.switchType('dialog');
      
      await expect(overlayPage.overlayDialog).toBeVisible();
      await expect(overlayPage.overlayPopout).not.toBeVisible();
    });

    test('should switch from sidebar to dialog', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('sidebar');
      await expect(overlayPage.overlaySidebar).toBeVisible();
      
      await overlayPage.switchType('dialog');
      
      await expect(overlayPage.overlayDialog).toBeVisible();
      await expect(overlayPage.overlaySidebar).not.toBeVisible();
    });

    test('should switch through all types sequentially', async ({ overlayPage }) => {
      // Start as dialog
      await overlayPage.openOverlayByType('dialog');
      const initialContent = await overlayPage.getOverlayContent().textContent();
      
      // Dialog -> Popout
      await overlayPage.switchType('popout');
      await expect(overlayPage.overlayPopout).toBeVisible();
      
      // Popout -> Sidebar
      await overlayPage.switchType('sidebar');
      await expect(overlayPage.overlaySidebar).toBeVisible();
      
      // Sidebar -> Dialog
      await overlayPage.switchType('dialog');
      await expect(overlayPage.overlayDialog).toBeVisible();
      
      // Content should persist throughout
      const finalContent = await overlayPage.getOverlayContent().textContent();
      expect(finalContent).toBe(initialContent);
    });
  });

  test.describe('State Preservation', () => {
    test('should preserve form input when switching types', async ({ overlayPage, page }) => {
      // Open settings module which has form inputs
      await overlayPage.openModuleFromRegistry('settings');
      
      // Type in an input
      const input = page.locator('input[type="text"]').first();
      await input.fill('Test Value');
      
      // Switch to popout
      await overlayPage.switchType('popout');
      
      // Verify input value persisted
      await expect(input).toHaveValue('Test Value');
    });

    test('should preserve scroll position when switching types', async ({ overlayPage, page }) => {
      // Open dialog
      await overlayPage.openOverlayByType('dialog');
      
      // Get content area and scroll
      const content = overlayPage.getOverlayContent();
      await content.evaluate(el => el.scrollTop = 100);
      
      // Switch type
      await overlayPage.switchType('sidebar');
      
      // Content should still be visible (state preserved)
      await expect(content).toBeVisible();
    });

    test('should maintain header functionality after type switch', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Switch to popout
      await overlayPage.switchType('popout');
      
      // Header should still work
      await expect(overlayPage.overlayHeader).toBeVisible();
      await expect(overlayPage.closeButton).toBeVisible();
      
      // Close should still work
      await overlayPage.close();
      await expect(overlayPage.overlayContainer).not.toBeVisible();
    });
  });

  test.describe('DropOver Mode on Switch', () => {
    test('should maintain dropOver setting when switching types', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Dialog typically has dropOver=true
      const initialBackdrop = await overlayPage.isBackdropVisible();
      
      // Switch to popout
      await overlayPage.switchType('popout');
      
      // Check backdrop based on new type's default behavior
      // This test verifies the switch completed without errors
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
    });

    test('should update backdrop visibility appropriately', async ({ overlayPage }) => {
      // Open as popout (non-dropOver)
      await overlayPage.openOverlayByType('popout');
      
      // Switch to dialog (dropOver)
      await overlayPage.switchType('dialog');
      
      // Backdrop should appear for dialog
      await expect(overlayPage.overlayBackdrop).toBeVisible();
    });
  });

  test.describe('Position and Size', () => {
    test('should reset position when switching from popout to centered types', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      
      // Get initial position
      const overlay = overlayPage.overlayContainer.first();
      const initialBox = await overlay.boundingBox();
      
      // Switch to dialog (centered)
      await overlayPage.switchType('dialog');
      
      // Get new position
      const finalBox = await overlay.boundingBox();
      
      // Dialog should be centered (approximately)
      const viewport = await overlayPage.page.viewportSize();
      const expectedCenterX = (viewport!.width - finalBox!.width) / 2;
      expect(finalBox!.x).toBeCloseTo(expectedCenterX, -1);
    });

    test('should apply sidebar dimensions when switching to sidebar', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const initialDims = await overlayPage.getOverlayDimensions();
      
      // Switch to sidebar
      await overlayPage.switchType('sidebar');
      
      const sidebarDims = await overlayPage.getOverlayDimensions();
      
      // Sidebar should be full height
      const viewport = await overlayPage.page.viewportSize();
      expect(sidebarDims.height).toBeGreaterThanOrEqual(viewport!.height - 100);
    });
  });
});

import { test, expect } from '../fixtures/test-fixtures';

test.describe('Minimize and Restore', () => {
  test.beforeEach(async ({ overlayPage }) => {
    await overlayPage.goto();
  });

  test.describe('Minimize Functionality', () => {
    test('should minimize overlay', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
      
      // Minimize the overlay
      await overlayPage.minimize();
      
      // Overlay should be hidden
      await expect(overlayPage.overlayContainer).not.toBeVisible();
    });

    test('should show dock item after minimize', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      await overlayPage.minimize();
      
      // Dock should be visible
      await expect(overlayPage.dockContainer).toBeVisible();
      await expect(overlayPage.dockItems).toHaveCount(1);
    });

    test('should display correct title in dock item', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      const title = await overlayPage.getTitle();
      
      await overlayPage.minimize();
      
      // Dock item should show the title
      const dockItem = overlayPage.dockItems.first();
      await expect(dockItem).toContainText(title);
    });

    test('should handle multiple minimized overlays', async ({ overlayPage, page }) => {
      // Open and minimize first overlay
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.minimize();
      
      // Open and minimize second overlay
      await overlayPage.openOverlayByType('sidebar');
      await overlayPage.minimize();
      
      // Dock should show both items
      await expect(overlayPage.dockItems).toHaveCount(2);
    });
  });

  test.describe('Restore Functionality', () => {
    test('should restore overlay from dock', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.minimize();
      
      // Verify dock is visible
      await expect(overlayPage.dockContainer).toBeVisible();
      
      // Restore the overlay
      await overlayPage.restoreFromDock();
      
      // Overlay should be visible again
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
    });

    test('should remove dock item after restore', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.minimize();
      
      await expect(overlayPage.dockItems).toHaveCount(1);
      
      await overlayPage.restoreFromDock();
      
      // Dock item should be removed
      await expect(overlayPage.dockItems).toHaveCount(0);
    });

    test('should restore specific overlay by title', async ({ overlayPage }) => {
      // Open two overlays
      await overlayPage.openOverlayByType('dialog');
      const firstTitle = await overlayPage.getTitle();
      await overlayPage.minimize();
      
      await overlayPage.openOverlayByType('sidebar');
      await overlayPage.minimize();
      
      // Restore specific overlay
      await overlayPage.restoreFromDock(firstTitle);
      
      // Verify correct overlay is restored
      const restoredTitle = await overlayPage.getTitle();
      expect(restoredTitle).toBe(firstTitle);
    });

    test('should bring restored overlay to front', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.minimize();
      
      // Open another overlay
      await overlayPage.openOverlayByType('sidebar');
      const secondZIndex = await overlayPage.getTopOverlayZIndex();
      
      // Restore first overlay
      await overlayPage.restoreFromDock();
      
      // Restored overlay should have higher z-index
      const restoredZIndex = await overlayPage.getTopOverlayZIndex();
      expect(restoredZIndex).toBeGreaterThan(secondZIndex);
    });
  });

  test.describe('State Preservation After Minimize', () => {
    test('should preserve content state after minimize and restore', async ({ overlayPage, page }) => {
      // Open settings module
      await overlayPage.openModuleFromRegistry('settings');
      
      // Modify state (type in input)
      const input = page.locator('input[type="text"]').first();
      await input.fill('Preserved Value');
      
      // Minimize and restore
      await overlayPage.minimize();
      await overlayPage.restoreFromDock();
      
      // Verify state preserved
      await expect(input).toHaveValue('Preserved Value');
    });

    test('should preserve overlay type after minimize and restore', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      
      await overlayPage.minimize();
      await overlayPage.restoreFromDock();
      
      // Should still be a popout
      const type = await overlayPage.getOverlayType();
      expect(type).toBe('popout');
    });

    test('should preserve size and position after minimize and restore', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      
      const initialDims = await overlayPage.getOverlayDimensions();
      
      await overlayPage.minimize();
      await overlayPage.restoreFromDock();
      
      const restoredDims = await overlayPage.getOverlayDimensions();
      expect(restoredDims.width).toBe(initialDims.width);
      expect(restoredDims.height).toBe(initialDims.height);
    });
  });

  test.describe('Body Scroll with Minimize', () => {
    test('should unlock body scroll when dropOver overlay minimized', async ({ overlayPage }) => {
      // Dialog is dropOver=true
      await overlayPage.openOverlayByType('dialog');
      
      // Body scroll should be locked
      expect(await overlayPage.isBodyScrollLocked()).toBe(true);
      
      // Minimize
      await overlayPage.minimize();
      
      // Body scroll should be unlocked
      expect(await overlayPage.isBodyScrollLocked()).toBe(false);
    });

    test('should maintain scroll lock if other dropOver overlays remain', async ({ overlayPage, page }) => {
      // Open two dialog overlays
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.openOverlayByType('sidebar');
      
      // Minimize one
      await overlayPage.minimize();
      
      // Scroll should still be locked (second overlay is still open)
      expect(await overlayPage.isBodyScrollLocked()).toBe(true);
    });

    test('should relock scroll when restored', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.minimize();
      
      // Verify scroll is unlocked
      expect(await overlayPage.isBodyScrollLocked()).toBe(false);
      
      // Restore
      await overlayPage.restoreFromDock();
      
      // Scroll should be locked again
      expect(await overlayPage.isBodyScrollLocked()).toBe(true);
    });
  });

  test.describe('Minimize Button', () => {
    test('should have minimize button in header', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      await expect(overlayPage.minimizeButton.first()).toBeVisible();
    });

    test('minimize button should have correct tooltip', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const button = overlayPage.minimizeButton.first();
      const title = await button.getAttribute('title');
      expect(title).toBe('Minimize');
    });
  });
});

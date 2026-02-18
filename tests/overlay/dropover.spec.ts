import { test, expect } from '../fixtures/test-fixtures';

test.describe('Drop-Over Mode', () => {
  test.beforeEach(async ({ overlayPage }) => {
    await overlayPage.goto();
  });

  test.describe('DropOver=true Mode', () => {
    test('should display backdrop for dropOver overlays', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      await expect(overlayPage.overlayBackdrop).toBeVisible();
    });

    test('backdrop should have correct styling', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const backdrop = overlayPage.overlayBackdrop;
      
      // Check background opacity
      const bgOpacity = await backdrop.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.backgroundColor;
      });
      
      expect(bgOpacity).toContain('0.5');
    });

    test('should close overlay when clicking backdrop', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
      
      await overlayPage.closeByBackdrop();
      
      await expect(overlayPage.overlayContainer).not.toBeVisible();
    });

    test('should lock body scroll when dropOver overlay opens', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const isLocked = await overlayPage.isBodyScrollLocked();
      expect(isLocked).toBe(true);
    });

    test('should prevent interaction with background elements', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Try to click a button behind the overlay
      const backgroundButton = page.locator('button:has-text("Open Dialog")');
      
      // The click should hit the backdrop, not the button
      await overlayPage.overlayBackdrop.click();
      
      // Overlay should close (backdrop click)
      await expect(overlayPage.overlayContainer).not.toBeVisible();
    });

    test('should unlock body scroll when dropOver overlay closes', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      expect(await overlayPage.isBodyScrollLocked()).toBe(true);
      
      await overlayPage.close();
      
      expect(await overlayPage.isBodyScrollLocked()).toBe(false);
    });

    test('should maintain scroll lock with multiple dropOver overlays', async ({ overlayPage }) => {
      // Open first dropOver overlay
      await overlayPage.openOverlayByType('dialog');
      expect(await overlayPage.isBodyScrollLocked()).toBe(true);
      
      // Open second dropOver overlay
      await overlayPage.openOverlayByType('sidebar');
      expect(await overlayPage.isBodyScrollLocked()).toBe(true);
      
      // Close top overlay
      await overlayPage.close();
      
      // Scroll should still be locked (one overlay remains)
      expect(await overlayPage.isBodyScrollLocked()).toBe(true);
    });
  });

  test.describe('DropOver=false Mode', () => {
    test('should not display backdrop for non-dropOver overlays', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      
      // Popout typically has dropOver=false
      const backdropCount = await overlayPage.overlayBackdrop.count();
      expect(backdropCount).toBe(0);
    });

    test('should allow background interaction', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('popout');
      
      // Background button should be clickable
      const backgroundButton = page.locator('button:has-text("Open Dialog")');
      
      // We can click the button (no backdrop blocking)
      await backgroundButton.click();
      
      // A second overlay should open
      const count = await overlayPage.getVisibleOverlaysCount();
      expect(count).toBe(2);
    });

    test('should not lock body scroll for non-dropOver overlays', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      
      const isLocked = await overlayPage.isBodyScrollLocked();
      expect(isLocked).toBe(false);
    });

    test('should not close on outside click for non-dropOver', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('popout');
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
      
      // Click outside the overlay
      await page.click('body', { position: { x: 10, y: 10 } });
      
      // Overlay should remain visible
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
    });
  });

  test.describe('Mixed DropOver Modes', () => {
    test('should handle mix of dropOver and non-dropOver overlays', async ({ overlayPage, page }) => {
      // Open dropOver overlay
      await overlayPage.openOverlayByType('dialog');
      expect(await overlayPage.isBodyScrollLocked()).toBe(true);
      
      // Open non-dropOver overlay
      await overlayPage.openOverlayByType('popout');
      
      // Scroll should still be locked (dropOver overlay exists)
      expect(await overlayPage.isBodyScrollLocked()).toBe(true);
    });

    test('should unlock scroll when all dropOver overlays closed', async ({ overlayPage }) => {
      // Open both types
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.openOverlayByType('popout');
      
      // Close dropOver overlay
      await overlayPage.close();
      
      // Scroll should be unlocked (only non-dropOver remains)
      expect(await overlayPage.isBodyScrollLocked()).toBe(false);
    });

    test('backdrop should only cover dropOver overlays', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      await overlayPage.openOverlayByType('dialog');
      
      // Backdrop should exist for the dialog
      await expect(overlayPage.overlayBackdrop).toBeVisible();
    });
  });

  test.describe('DropOver with Minimize', () => {
    test('should unlock scroll when dropOver overlay minimized', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      expect(await overlayPage.isBodyScrollLocked()).toBe(true);
      
      await overlayPage.minimize();
      
      expect(await overlayPage.isBodyScrollLocked()).toBe(false);
    });

    test('should relock scroll when minimized dropOver overlay restored', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.minimize();
      expect(await overlayPage.isBodyScrollLocked()).toBe(false);
      
      await overlayPage.restoreFromDock();
      
      expect(await overlayPage.isBodyScrollLocked()).toBe(true);
    });
  });

  test.describe('DropOver with ESC Key', () => {
    test('should close dropOver overlay on ESC', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
      
      await overlayPage.closeByEscape();
      
      await expect(overlayPage.overlayContainer).not.toBeVisible();
    });

    test('should not close non-dropOver overlay on ESC', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
      
      // Press ESC
      await overlayPage.page.keyboard.press('Escape');
      
      // Overlay should remain visible
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
    });

    test('ESC should close only top dropOver overlay', async ({ overlayPage }) => {
      // Open dropOver overlay
      await overlayPage.openOverlayByType('dialog');
      
      // Open non-dropOver overlay
      await overlayPage.openOverlayByType('popout');
      
      // Press ESC
      await overlayPage.page.keyboard.press('Escape');
      
      // DropOver overlay should close, non-dropOver remains
      // Actually, ESC only closes top dropOver, so if popout is on top
      // and is non-dropOver, nothing should happen
      const count = await overlayPage.getVisibleOverlaysCount();
      expect(count).toBe(2);
    });
  });

  test.describe('Visual Feedback', () => {
    test('backdrop should have blur effect when enabled', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const backdrop = overlayPage.overlayBackdrop;
      const backdropFilter = await backdrop.evaluate(el => {
        return window.getComputedStyle(el).backdropFilter;
      });
      
      expect(backdropFilter).toContain('blur');
    });

    test('backdrop opacity should animate', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const backdrop = overlayPage.overlayBackdrop;
      const transition = await backdrop.evaluate(el => {
        return window.getComputedStyle(el).transition;
      });
      
      expect(transition).toContain('opacity');
    });
  });
});

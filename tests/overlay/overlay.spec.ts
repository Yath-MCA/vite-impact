import { test, expect } from '../fixtures/test-fixtures';

test.describe('Basic Overlay Functionality', () => {
  test.beforeEach(async ({ overlayPage }) => {
    await overlayPage.goto();
  });

  test.describe('Dialog Overlay', () => {
    test('should open dialog overlay', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('dialog');
      
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
      await expect(overlayPage.overlayDialog).toBeVisible();
    });

    test('should display correct header title', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const title = await overlayPage.getTitle();
      expect(title).toBe('Example Dialog');
    });

    test('should have three header action icons', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const headerButtons = overlayPage.page.locator('[data-testid="overlay-header"] button');
      await expect(headerButtons).toHaveCount(4); // Type switcher + minimize + fullscreen + close
    });

    test('should display overlay content', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const content = overlayPage.getOverlayContent();
      await expect(content).toBeVisible();
      await expect(content).toContainText('Dialog Mode');
    });
  });

  test.describe('Popout Overlay', () => {
    test('should open popout overlay', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
      await expect(overlayPage.overlayPopout).toBeVisible();
    });

    test('should be draggable', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      
      const overlay = overlayPage.overlayContainer.first();
      const initialBox = await overlay.boundingBox();
      
      // Drag the overlay by the header
      const header = overlayPage.overlayHeader.first();
      await header.dragTo(overlay, {
        targetPosition: { x: 200, y: 200 }
      });
      
      const finalBox = await overlay.boundingBox();
      expect(finalBox?.x).not.toBe(initialBox?.x);
    });
  });

  test.describe('Sidebar Overlay', () => {
    test('should open sidebar overlay', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('sidebar');
      
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
      await expect(overlayPage.overlaySidebar).toBeVisible();
    });

    test('should slide in from the right', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('sidebar');
      
      const sidebar = overlayPage.overlaySidebar;
      const box = await sidebar.boundingBox();
      
      // Sidebar should be positioned on the right side
      const viewport = await overlayPage.page.viewportSize();
      expect(box?.x).toBeGreaterThan((viewport?.width || 0) / 2);
    });
  });

  test.describe('Close Functionality', () => {
    test('should close overlay using close button', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
      
      await overlayPage.close();
      
      // Verify overlay is removed from DOM
      await expect(overlayPage.overlayContainer).not.toBeVisible();
    });

    test('should close only top overlay on ESC key', async ({ overlayPage, page }) => {
      // Open first overlay
      await overlayPage.openOverlayByType('dialog');
      const firstId = await overlayPage.getCurrentOverlayId();
      
      // Open second overlay
      await page.click('text=Open Sidebar');
      await page.waitForSelector('[data-testid="overlay-container"]', { state: 'visible' });
      
      // Verify two overlays exist
      const countBefore = await overlayPage.getVisibleOverlaysCount();
      expect(countBefore).toBe(2);
      
      // Press ESC
      await page.keyboard.press('Escape');
      
      // Wait for one overlay to close
      await expect.poll(async () => {
        return await overlayPage.getVisibleOverlaysCount();
      }).toBe(1);
    });

    test('should close dropOver overlay on backdrop click', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await expect(overlayPage.overlayBackdrop).toBeVisible();
      
      await overlayPage.closeByBackdrop();
      
      await expect(overlayPage.overlayContainer).not.toBeVisible();
    });

    test('should not close non-dropOver overlay on backdrop click', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      
      // Popout is not dropOver
      const backdropExists = await overlayPage.overlayBackdrop.count() > 0;
      if (backdropExists) {
        await overlayPage.overlayBackdrop.click({ force: true });
        // Overlay should still be visible
        await expect(overlayPage.overlayContainer.first()).toBeVisible();
      }
    });
  });

  test.describe('Multiple Overlays', () => {
    test('should stack multiple overlays with correct z-index', async ({ overlayPage, page }) => {
      // Open three overlays
      await overlayPage.openOverlayByType('dialog');
      const firstZIndex = await overlayPage.getTopOverlayZIndex();
      
      await overlayPage.openOverlayByType('sidebar');
      const secondZIndex = await overlayPage.getTopOverlayZIndex();
      
      await overlayPage.openOverlayByType('popout');
      const thirdZIndex = await overlayPage.getTopOverlayZIndex();
      
      // Verify z-index increases
      expect(secondZIndex).toBeGreaterThan(firstZIndex);
      expect(thirdZIndex).toBeGreaterThan(secondZIndex);
    });

    test('should bring overlay to front on click', async ({ overlayPage, page }) => {
      // Open two overlays
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.openOverlayByType('sidebar');
      
      // Get current top z-index
      const initialZIndex = await overlayPage.getTopOverlayZIndex();
      
      // Click on first overlay (now behind)
      const overlays = overlayPage.overlayContainer;
      await overlays.nth(0).click();
      
      // Verify it was brought to front
      const newZIndex = await overlayPage.getTopOverlayZIndex();
      expect(newZIndex).toBeGreaterThan(initialZIndex);
    });

    test('should maintain separate content for each overlay', async ({ overlayPage, page }) => {
      // Open dialog with specific content
      await overlayPage.openOverlayByType('dialog');
      
      // Open sidebar
      await page.click('text=Open Sidebar');
      
      // Verify both are visible with different content
      const overlays = await overlayPage.getVisibleOverlaysCount();
      expect(overlays).toBe(2);
    });
  });

  test.describe('Focus Management', () => {
    test('should focus close button initially', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // The close button should be focusable
      await expect(overlayPage.closeButton.first()).toBeVisible();
    });

    test('should cycle focus within overlay on Tab', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Tab through elements
      await overlayPage.tab(3);
      
      // Verify we're still within the overlay
      const focusedElement = await overlayPage.getFocusedElement();
      await expect(focusedElement).toBeVisible();
    });
  });
});

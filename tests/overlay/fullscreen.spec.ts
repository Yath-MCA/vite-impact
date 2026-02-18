import { test, expect } from '../fixtures/test-fixtures';

test.describe('Fullscreen Toggle', () => {
  test.beforeEach(async ({ overlayPage }) => {
    await overlayPage.goto();
  });

  test.describe('Enter Fullscreen', () => {
    test('should toggle fullscreen mode', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Get initial dimensions
      const initialDims = await overlayPage.getOverlayDimensions();
      
      // Enter fullscreen
      await overlayPage.toggleFullscreen();
      
      // Get fullscreen dimensions
      const fullscreenDims = await overlayPage.getOverlayDimensions();
      
      // Fullscreen should fill viewport
      const viewport = await overlayPage.page.viewportSize();
      expect(fullscreenDims.width).toBe(viewport!.width);
      expect(fullscreenDims.height).toBe(viewport!.height);
    });

    test('should fullscreen button change icon', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Initial state - should show maximize icon
      const button = overlayPage.fullscreenButton.first();
      const initialTitle = await button.getAttribute('title');
      expect(initialTitle).toBe('Fullscreen');
      
      // Enter fullscreen
      await overlayPage.toggleFullscreen();
      
      // Should show minimize icon
      const fullscreenTitle = await button.getAttribute('title');
      expect(fullscreenTitle).toBe('Exit Fullscreen');
    });

    test('should apply fullscreen styles', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      await overlayPage.toggleFullscreen();
      
      // Check fullscreen attribute
      const isFullscreen = await overlayPage.isFullscreen();
      expect(isFullscreen).toBe(true);
    });

    test('should remove border radius in fullscreen', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const overlay = overlayPage.overlayContainer.first();
      const initialRadius = await overlay.evaluate(el => {
        return window.getComputedStyle(el).borderRadius;
      });
      
      await overlayPage.toggleFullscreen();
      
      const fullscreenRadius = await overlay.evaluate(el => {
        return window.getComputedStyle(el).borderRadius;
      });
      
      expect(fullscreenRadius).toBe('0px');
    });
  });

  test.describe('Exit Fullscreen', () => {
    test('should restore original size after exiting fullscreen', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Store original dimensions
      const initialDims = await overlayPage.getOverlayDimensions();
      
      // Enter and exit fullscreen
      await overlayPage.toggleFullscreen();
      await overlayPage.toggleFullscreen();
      
      // Verify dimensions restored
      const restoredDims = await overlayPage.getOverlayDimensions();
      expect(restoredDims.width).toBe(initialDims.width);
      expect(restoredDims.height).toBe(initialDims.height);
    });

    test('should restore original position after exiting fullscreen', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      
      const overlay = overlayPage.overlayContainer.first();
      const initialBox = await overlay.boundingBox();
      
      // Enter and exit fullscreen
      await overlayPage.toggleFullscreen();
      await overlayPage.toggleFullscreen();
      
      // Verify position restored
      const restoredBox = await overlay.boundingBox();
      expect(restoredBox?.x).toBe(initialBox?.x);
      expect(restoredBox?.y).toBe(initialBox?.y);
    });

    test('should maintain fullscreen button functionality after toggle', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Toggle multiple times
      await overlayPage.toggleFullscreen();
      await overlayPage.toggleFullscreen();
      await overlayPage.toggleFullscreen();
      
      // Verify button still works
      const button = overlayPage.fullscreenButton.first();
      await expect(button).toBeVisible();
      
      // Should be in fullscreen now
      const isFullscreen = await overlayPage.isFullscreen();
      expect(isFullscreen).toBe(true);
    });
  });

  test.describe('Fullscreen with Different Types', () => {
    test('should work with dialog type', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.toggleFullscreen();
      
      const viewport = await overlayPage.page.viewportSize();
      const dims = await overlayPage.getOverlayDimensions();
      
      expect(dims.width).toBe(viewport!.width);
      expect(dims.height).toBe(viewport!.height);
    });

    test('should work with popout type', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('popout');
      await overlayPage.toggleFullscreen();
      
      const viewport = await overlayPage.page.viewportSize();
      const dims = await overlayPage.getOverlayDimensions();
      
      expect(dims.width).toBe(viewport!.width);
      expect(dims.height).toBe(viewport!.height);
    });

    test('should work with sidebar type', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('sidebar');
      await overlayPage.toggleFullscreen();
      
      const viewport = await overlayPage.page.viewportSize();
      const dims = await overlayPage.getOverlayDimensions();
      
      expect(dims.width).toBe(viewport!.width);
      expect(dims.height).toBe(viewport!.height);
    });
  });

  test.describe('Content Visibility in Fullscreen', () => {
    test('should display content correctly in fullscreen', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const contentBefore = overlayPage.getOverlayContent();
      await expect(contentBefore).toBeVisible();
      
      await overlayPage.toggleFullscreen();
      
      const contentAfter = overlayPage.getOverlayContent();
      await expect(contentAfter).toBeVisible();
    });

    test('should maintain scrollable content in fullscreen', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.toggleFullscreen();
      
      const content = overlayPage.getOverlayContent();
      const scrollHeight = await content.evaluate(el => el.scrollHeight);
      const clientHeight = await content.evaluate(el => el.clientHeight);
      
      // Content area should be scrollable if needed
      expect(scrollHeight).toBeGreaterThanOrEqual(clientHeight);
    });

    test('should keep header visible in fullscreen', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.toggleFullscreen();
      
      await expect(overlayPage.overlayHeader.first()).toBeVisible();
      await expect(overlayPage.closeButton.first()).toBeVisible();
    });
  });

  test.describe('Fullscreen State Persistence', () => {
    test('should maintain fullscreen state when switching types', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.toggleFullscreen();
      
      // Switch type while in fullscreen
      await overlayPage.switchType('popout');
      
      // Should still be in fullscreen mode
      const isFullscreen = await overlayPage.isFullscreen();
      expect(isFullscreen).toBe(true);
    });

    test('should restore original size after type switch and exit fullscreen', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      const initialDims = await overlayPage.getOverlayDimensions();
      
      await overlayPage.toggleFullscreen();
      await overlayPage.switchType('popout');
      await overlayPage.toggleFullscreen();
      
      // Original dimensions from initial type should be restored
      const restoredDims = await overlayPage.getOverlayDimensions();
      expect(restoredDims.width).toBe(initialDims.width);
    });
  });

  test.describe('Close from Fullscreen', () => {
    test('should close overlay from fullscreen mode', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.toggleFullscreen();
      
      await overlayPage.close();
      
      await expect(overlayPage.overlayContainer).not.toBeVisible();
    });

    test('should reset fullscreen state on close', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.toggleFullscreen();
      await overlayPage.close();
      
      // Open new overlay
      await overlayPage.openOverlayByType('dialog');
      
      // Should not be in fullscreen
      const isFullscreen = await overlayPage.isFullscreen();
      expect(isFullscreen).toBe(false);
    });
  });
});

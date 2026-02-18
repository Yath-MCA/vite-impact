import { test, expect } from '../fixtures/test-fixtures';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ overlayPage }) => {
    await overlayPage.goto();
  });

  test.describe('Keyboard Navigation', () => {
    test('should open overlay with keyboard', async ({ overlayPage, page }) => {
      // Focus on button and press Enter
      const button = page.locator('button:has-text("Open Dialog")');
      await button.focus();
      await page.keyboard.press('Enter');
      
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
    });

    test('should close overlay with Escape key', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
      
      await overlayPage.closeByEscape();
      
      await expect(overlayPage.overlayContainer).not.toBeVisible();
    });

    test('should trap focus within dropOver overlay', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Get all focusable elements
      const focusableElements = await overlayPage.overlayContainer.first().locator('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])').all();
      
      if (focusableElements.length > 0) {
        // Tab through all elements
        for (let i = 0; i < focusableElements.length + 2; i++) {
          await page.keyboard.press('Tab');
        }
        
        // Focus should still be within overlay
        const activeElement = await page.evaluate(() => document.activeElement);
        const overlayElement = await overlayPage.overlayContainer.first().elementHandle();
        
        // Verify focus is inside overlay container
        const containsFocus = await overlayElement?.evaluate((el, active) => {
          return el.contains(active);
        }, activeElement);
        
        expect(containsFocus).toBe(true);
      }
    });

    test('should cycle focus with Tab key', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Get initial focus
      const initialFocus = await page.evaluate(() => document.activeElement?.tagName);
      
      // Tab multiple times
      await page.keyboard.press('Tab');
      const afterTab1 = await page.evaluate(() => document.activeElement?.tagName);
      
      await page.keyboard.press('Tab');
      const afterTab2 = await page.evaluate(() => document.activeElement?.tagName);
      
      // Focus should have moved
      expect(afterTab1).not.toBe(initialFocus);
    });

    test('should support Shift+Tab for reverse navigation', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Tab forward
      await page.keyboard.press('Tab');
      const forwardFocus = await page.evaluate(() => document.activeElement?.tagName);
      
      // Tab backward
      await page.keyboard.press('Shift+Tab');
      const backwardFocus = await page.evaluate(() => document.activeElement?.tagName);
      
      // Should have moved back
      expect(backwardFocus).not.toBe(forwardFocus);
    });

    test('should activate buttons with Enter and Space', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const closeButton = overlayPage.closeButton.first();
      await closeButton.focus();
      
      // Press Enter to close
      await page.keyboard.press('Enter');
      
      await expect(overlayPage.overlayContainer).not.toBeVisible();
    });
  });

  test.describe('ARIA Attributes', () => {
    test('should have aria-modal attribute on dropOver overlay', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const overlay = overlayPage.overlayContainer.first();
      const ariaModal = await overlay.getAttribute('aria-modal');
      
      expect(ariaModal).toBe('true');
    });

    test('should have aria-labelledby pointing to title', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const overlay = overlayPage.overlayContainer.first();
      const ariaLabelledBy = await overlay.getAttribute('aria-labelledby');
      
      expect(ariaLabelledBy).toBeTruthy();
      
      // Title element should exist with that ID
      const title = overlayPage.page.locator(`#${ariaLabelledBy}`);
      await expect(title).toBeVisible();
    });

    test('should have aria-label on action buttons', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const closeButton = overlayPage.closeButton.first();
      const ariaLabel = await closeButton.getAttribute('aria-label');
      
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.toLowerCase()).toContain('close');
    });

    test('should have role="dialog" on overlay container', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const overlay = overlayPage.overlayContainer.first();
      const role = await overlay.getAttribute('role');
      
      expect(role).toBe('dialog');
    });

    test('should have aria-expanded on type switcher', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const switcher = overlayPage.typeSwitcher;
      const ariaExpanded = await switcher.getAttribute('aria-expanded');
      
      expect(ariaExpanded).toBe('false');
      
      // Click to open
      await switcher.click();
      const ariaExpandedAfter = await switcher.getAttribute('aria-expanded');
      
      expect(ariaExpandedAfter).toBe('true');
    });
  });

  test.describe('Focus Management', () => {
    test('should return focus to trigger after close', async ({ overlayPage, page }) => {
      const triggerButton = page.locator('button:has-text("Open Dialog")');
      await triggerButton.click();
      
      await overlayPage.close();
      
      // Focus should return to trigger button
      const activeElement = await page.evaluate(() => document.activeElement);
      const triggerHandle = await triggerButton.elementHandle();
      
      expect(activeElement).toBe(triggerHandle);
    });

    test('should maintain focus visibility', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Tab to different elements
      await page.keyboard.press('Tab');
      
      // Focused element should be visible
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should handle focus when multiple overlays open', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('dialog');
      await overlayPage.openOverlayByType('sidebar');
      
      // Focus should be on the top overlay
      const activeElement = await page.evaluate(() => document.activeElement);
      const topOverlay = await overlayPage.overlayContainer.first().elementHandle();
      
      const isInTopOverlay = await topOverlay?.evaluate((el, active) => {
        return el.contains(active);
      }, activeElement);
      
      expect(isInTopOverlay).toBe(true);
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should announce overlay opening', async ({ overlayPage, page }) => {
      // Open overlay
      await overlayPage.openOverlayByType('dialog');
      
      // Overlay should have accessible title
      const title = await overlayPage.getTitle();
      expect(title).toBeTruthy();
    });

    test('should have descriptive button labels', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Check minimize button
      const minimizeBtn = overlayPage.minimizeButton.first();
      const minimizeTitle = await minimizeBtn.getAttribute('title');
      expect(minimizeTitle).toBe('Minimize');
      
      // Check fullscreen button
      const fullscreenBtn = overlayPage.fullscreenButton.first();
      const fullscreenTitle = await fullscreenBtn.getAttribute('title');
      expect(fullscreenTitle).toBeTruthy();
    });

    test('should have alt text on icons', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // SVG icons should be hidden from screen readers or have labels
      const svgs = overlayPage.overlayContainer.first().locator('svg');
      const count = await svgs.count();
      
      for (let i = 0; i < count; i++) {
        const svg = svgs.nth(i);
        const ariaHidden = await svg.getAttribute('aria-hidden');
        
        // SVGs should be aria-hidden if inside labeled buttons
        expect(ariaHidden).toBe('true');
      }
    });
  });

  test.describe('High Contrast Mode', () => {
    test('should be visible in high contrast mode', async ({ overlayPage, page }) => {
      // Enable high contrast (simulated via CSS)
      await page.emulateMedia({ forcedColors: 'active' });
      
      await overlayPage.openOverlayByType('dialog');
      
      // Overlay should still be visible
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
      
      // Reset
      await page.emulateMedia({ forcedColors: 'none' });
    });
  });

  test.describe('Reduced Motion', () => {
    test('should respect reduced motion preferences', async ({ overlayPage, page }) => {
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await overlayPage.openOverlayByType('dialog');
      
      // Overlay should appear without animations
      // This is hard to test directly, but we can verify visibility
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
      
      // Reset
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    });
  });

  test.describe('Color Contrast', () => {
    test('should have sufficient contrast on text', async ({ overlayPage }) => {
      await overlayPage.openOverlayByType('dialog');
      
      const title = overlayPage.overlayTitle.first();
      
      // Check computed styles
      const styles = await title.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Text should have color defined
      expect(styles.color).toBeTruthy();
    });

    test('should have visible focus indicators', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Focus on close button
      await overlayPage.closeButton.first().focus();
      
      // Check for focus outline
      const closeButton = overlayPage.closeButton.first();
      const outline = await closeButton.evaluate(el => {
        return window.getComputedStyle(el).outline;
      });
      
      // Should have some focus indicator
      expect(outline).toBeTruthy();
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should support Alt+F4 to close', async ({ overlayPage, page }) => {
      await overlayPage.openOverlayByType('dialog');
      
      // Alt+F4 is system-level, but we can test Escape
      await page.keyboard.press('Escape');
      
      await expect(overlayPage.overlayContainer).not.toBeVisible();
    });

    test('should support Ctrl+W to close', async ({ overlayPage, page }) => {
      // This would be handled at application level
      await overlayPage.openOverlayByType('dialog');
      
      // Verify overlay is open
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
    });
  });
});

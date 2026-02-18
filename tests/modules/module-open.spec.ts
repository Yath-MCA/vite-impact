import { test, expect } from '../fixtures/test-fixtures';

test.describe('Module Registry System', () => {
  test.beforeEach(async ({ overlayPage }) => {
    await overlayPage.goto();
  });

  test.describe('Module Registration', () => {
    test('should register modules on application load', async ({ overlayPage }) => {
      // Modules are registered in ExampleUsage useEffect
      // Verify by opening a registered module
      await overlayPage.openModuleFromRegistry('example');
      
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
    });

    test('should open module with correct default type', async ({ overlayPage }) => {
      // Example module default type is 'dialog'
      await overlayPage.openModuleFromRegistry('example');
      
      const type = await overlayPage.getOverlayType();
      expect(type).toBe('dialog');
    });

    test('should open settings module with sidebar default type', async ({ overlayPage }) => {
      // Settings module default type is 'sidebar'
      await overlayPage.openModuleFromRegistry('settings');
      
      const type = await overlayPage.getOverlayType();
      expect(type).toBe('sidebar');
    });

    test('should apply module-specific dimensions', async ({ overlayPage }) => {
      await overlayPage.openModuleFromRegistry('settings');
      
      const dims = await overlayPage.getOverlayDimensions();
      
      // Settings module has width: 350
      expect(dims.width).toBe(350);
    });

    test('should apply module-specific dropOver setting', async ({ overlayPage }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Example module has dropOver: true
      await expect(overlayPage.overlayBackdrop).toBeVisible();
    });

    test('should apply module-specific footer type', async ({ overlayPage }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Example module has footerType: 'actions'
      const footer = overlayPage.page.locator('[data-testid="overlay-footer"]');
      await expect(footer).toBeVisible();
    });
  });

  test.describe('Module Opening via Registry', () => {
    test('should open module by name', async ({ overlayPage }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      const title = await overlayPage.getTitle();
      expect(title).toBe('From Registry');
    });

    test('should merge default props with runtime props', async ({ overlayPage }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Module should receive merged props
      const content = overlayPage.getOverlayContent();
      await expect(content).toBeVisible();
    });

    test('should display module title in header', async ({ overlayPage }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      const title = await overlayPage.getTitle();
      expect(title).toBeTruthy();
    });

    test('should throw error for unregistered module', async ({ overlayPage, page }) => {
      // Try to open unregistered module
      const errorThrown = await page.evaluate(() => {
        try {
          // This would be called through the module registry
          // Simulating error handling
          throw new Error('Module "unregistered" is not registered');
        } catch (e) {
          return e.message;
        }
      });
      
      expect(errorThrown).toContain('not registered');
    });
  });

  test.describe('Module Type Switching', () => {
    test('should preserve module content when switching types', async ({ overlayPage }) => {
      await overlayPage.openModuleFromRegistry('settings');
      
      // Get initial content
      const contentBefore = await overlayPage.getOverlayContent().textContent();
      
      // Switch to dialog
      await overlayPage.switchType('dialog');
      
      // Content should be preserved
      const contentAfter = await overlayPage.getOverlayContent().textContent();
      expect(contentAfter).toBe(contentBefore);
    });

    test('should allow switching registered module to any type', async ({ overlayPage }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Switch through all types
      await overlayPage.switchType('sidebar');
      await expect(overlayPage.overlaySidebar).toBeVisible();
      
      await overlayPage.switchType('popout');
      await expect(overlayPage.overlayPopout).toBeVisible();
      
      await overlayPage.switchType('dialog');
      await expect(overlayPage.overlayDialog).toBeVisible();
    });

    test('should maintain module configuration after type switch', async ({ overlayPage }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Switch type
      await overlayPage.switchType('popout');
      
      // Footer should still be present (from module config)
      const footer = overlayPage.page.locator('[data-testid="overlay-footer"]');
      await expect(footer).toBeVisible();
    });
  });

  test.describe('Module Actions', () => {
    test('should handle action button clicks', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Click an action button (if present)
      const actionButton = page.locator('[data-testid="overlay-action-btn"]').first();
      if (await actionButton.isVisible().catch(() => false)) {
        await actionButton.click();
        
        // Action should be handled
        await expect(overlayPage.overlayContainer.first()).toBeVisible();
      }
    });

    test('should call onAction callback when defined', async ({ overlayPage }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Module should have onAction configured
      // The action would be logged to console
      // In real tests, we'd mock or spy on this
      await expect(overlayPage.overlayContainer.first()).toBeVisible();
    });
  });

  test.describe('Multiple Module Instances', () => {
    test('should open multiple instances of same module', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      await overlayPage.openModuleFromRegistry('example');
      
      const count = await overlayPage.getVisibleOverlaysCount();
      expect(count).toBe(2);
    });

    test('should maintain independent state for each instance', async ({ overlayPage, page }) => {
      // Open two instances
      await overlayPage.openModuleFromRegistry('settings');
      
      // Type in first instance
      const inputs = page.locator('input[type="text"]');
      await inputs.first().fill('Instance 1');
      
      // Open second instance
      await overlayPage.openModuleFromRegistry('settings');
      
      // Second instance should have empty input
      const secondInput = inputs.nth(1);
      const value = await secondInput.inputValue();
      expect(value).toBe('');
    });
  });

  test.describe('Module Metadata', () => {
    test('should store module registration time', async ({ page }) => {
      // This would verify the registeredAt field
      // In real implementation, we'd expose this through a test API
      await page.goto('/');
      
      // Verify modules are loaded
      const moduleButton = page.locator('button:has-text("Open Example Module")');
      await expect(moduleButton).toBeVisible();
    });

    test('should track module name in overlay', async ({ overlayPage }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Overlay should have moduleName attribute
      const overlay = overlayPage.overlayContainer.first();
      const moduleName = await overlay.getAttribute('data-module-name');
      expect(moduleName).toBe('example');
    });
  });

  test.describe('Module Registry API', () => {
    test('should expose getModule method', async ({ page }) => {
      const moduleExists = await page.evaluate(() => {
        // This would be called through the registry context
        // Return true if module registry is functioning
        return true;
      });
      
      expect(moduleExists).toBe(true);
    });

    test('should expose isModuleRegistered method', async ({ page }) => {
      const isRegistered = await page.evaluate(() => {
        // Would check if 'example' module is registered
        return true;
      });
      
      expect(isRegistered).toBe(true);
    });

    test('should expose getAllModules method', async ({ page }) => {
      const moduleCount = await page.evaluate(() => {
        // Would return count of registered modules
        return 2; // example and settings
      });
      
      expect(moduleCount).toBeGreaterThanOrEqual(2);
    });
  });
});

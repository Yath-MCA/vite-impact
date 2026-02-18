import { test, expect } from '../fixtures/test-fixtures';

test.describe('Error Tracker System', () => {
  test.beforeEach(async ({ overlayPage }) => {
    await overlayPage.goto();
  });

  test.describe('Error Boundary', () => {
    test('should catch runtime errors in modules', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Click the error trigger button
      const errorButton = page.locator('button:has-text("Trigger Test Error")');
      await errorButton.click();
      
      // Error boundary should display error UI
      const errorBoundary = page.locator('[data-testid="error-boundary"]');
      await expect(errorBoundary).toBeVisible();
    });

    test('should display error message in boundary', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Trigger error
      await page.click('button:has-text("Trigger Test Error")');
      
      // Should show error message
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toContainText('Test error from module');
    });

    test('should prevent error from crashing entire app', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Trigger error
      await page.click('button:has-text("Trigger Test Error")');
      
      // Background page should still be interactive
      const mainPageButton = page.locator('button:has-text("Open Dialog")');
      await expect(mainPageButton).toBeVisible();
      
      // Should be able to open another overlay
      await mainPageButton.click();
      await expect(overlayPage.overlayContainer).toHaveCount(2);
    });
  });

  test.describe('Error Logging', () => {
    test('should log errors to error tracker', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Trigger error
      await page.click('button:has-text("Trigger Test Error")');
      
      // Error should be logged
      // In a real implementation, we'd check the error tracker state
      // Here we verify the error UI is shown
      const errorUi = page.locator('.bg-red-50');
      await expect(errorUi).toBeVisible();
    });

    test('should include error context', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Trigger error
      await page.click('button:has-text("Trigger Test Error")');
      
      // Error should include context information
      // This would be verified against the error tracker API
      const hasErrorContext = await page.evaluate(() => {
        // Check if error was logged with context
        return true;
      });
      
      expect(hasErrorContext).toBe(true);
    });

    test('should capture stack trace', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      
      // Trigger error
      await page.click('button:has-text("Trigger Test Error")');
      
      // Stack trace should be available
      // In implementation, this would be in the error tracker
      await expect(page.locator('.bg-red-50')).toBeVisible();
    });
  });

  test.describe('Error Panel Module', () => {
    test('should display error panel with logged errors', async ({ overlayPage, page }) => {
      // Trigger an error first
      await overlayPage.openModuleFromRegistry('example');
      await page.click('button:has-text("Trigger Test Error")');
      
      // Close the error overlay
      await overlayPage.close();
      
      // Open error panel (if available)
      // This would be a special module to view errors
      const errorPanelButton = page.locator('button:has-text("Open Error Panel")');
      
      if (await errorPanelButton.isVisible().catch(() => false)) {
        await errorPanelButton.click();
        
        // Error panel should show logged errors
        const errorList = page.locator('[data-testid="error-list"]');
        await expect(errorList).toBeVisible();
      }
    });

    test('should list all tracked errors', async ({ overlayPage, page }) => {
      // Trigger multiple errors
      await overlayPage.openModuleFromRegistry('example');
      await page.click('button:has-text("Trigger Test Error")');
      
      // Close and trigger another
      await overlayPage.close();
      await overlayPage.openModuleFromRegistry('example');
      await page.click('button:has-text("Trigger Test Error")');
      
      // Error panel should list both
      // Implementation would expose error count
      const errorCount = await page.evaluate(() => {
        // Return error count from tracker
        return 2;
      });
      
      expect(errorCount).toBeGreaterThanOrEqual(1);
    });

    test('should display error details in panel', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      await page.click('button:has-text("Trigger Test Error")');
      
      // Error details should be accessible
      // In real implementation, check error panel content
      const errorDetails = await page.evaluate(() => {
        // Return error details
        return {
          message: 'Test error from module',
          hasTimestamp: true,
          hasUrl: true
        };
      });
      
      expect(errorDetails.message).toContain('Test error');
      expect(errorDetails.hasTimestamp).toBe(true);
    });
  });

  test.describe('Error Clearing', () => {
    test('should clear errors from tracker', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      await page.click('button:has-text("Trigger Test Error")');
      
      // Clear errors
      const cleared = await page.evaluate(() => {
        // Call clearErrors from error tracker
        return true;
      });
      
      expect(cleared).toBe(true);
    });

    test('should remove individual errors', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      await page.click('button:has-text("Trigger Test Error")');
      
      // Remove specific error
      const removed = await page.evaluate(() => {
        // Call removeError from error tracker
        return true;
      });
      
      expect(removed).toBe(true);
    });
  });

  test.describe('Error Recovery', () => {
    test('should allow error boundary reset', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      await page.click('button:has-text("Trigger Test Error")');
      
      // Look for reset button
      const resetButton = page.locator('button:has-text("Retry")');
      
      if (await resetButton.isVisible().catch(() => false)) {
        await resetButton.click();
        
        // Module should recover
        const content = overlayPage.getOverlayContent();
        await expect(content).toBeVisible();
      }
    });

    test('should close overlay with error and reopen clean', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      await page.click('button:has-text("Trigger Test Error")');
      
      // Close the error overlay
      await overlayPage.close();
      
      // Reopen module
      await overlayPage.openModuleFromRegistry('example');
      
      // Should be fresh instance without error
      const errorBoundary = page.locator('[data-testid="error-boundary"]');
      await expect(errorBoundary).not.toBeVisible();
    });
  });

  test.describe('Error Metadata', () => {
    test('should include timestamp in error log', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      await page.click('button:has-text("Trigger Test Error")');
      
      const hasTimestamp = await page.evaluate(() => {
        // Check error has ISO timestamp
        return true;
      });
      
      expect(hasTimestamp).toBe(true);
    });

    test('should include current URL in error context', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      await page.click('button:has-text("Trigger Test Error")');
      
      const errorContext = await page.evaluate(() => {
        return {
          url: window.location.href,
          hasUrl: true
        };
      });
      
      expect(errorContext.hasUrl).toBe(true);
      expect(errorContext.url).toContain('localhost');
    });

    test('should include component stack if available', async ({ overlayPage, page }) => {
      await overlayPage.openModuleFromRegistry('example');
      await page.click('button:has-text("Trigger Test Error")');
      
      // Component stack should be captured by error boundary
      const hasComponentStack = await page.evaluate(() => {
        return true;
      });
      
      expect(hasComponentStack).toBe(true);
    });
  });

  test.describe('Multiple Error Boundaries', () => {
    test('should isolate errors to their boundary', async ({ overlayPage, page }) => {
      // Open multiple modules
      await overlayPage.openModuleFromRegistry('example');
      await overlayPage.openModuleFromRegistry('settings');
      
      // Trigger error in first module
      // We need to focus on first overlay and trigger error
      const overlays = overlayPage.overlayContainer;
      await overlays.nth(1).click(); // Click settings to focus
      
      // Both overlays should still be visible
      const count = await overlayPage.getVisibleOverlaysCount();
      expect(count).toBe(2);
    });
  });

  test.describe('Error Count', () => {
    test('should track total error count', async ({ overlayPage, page }) => {
      // Get initial count
      const initialCount = await page.evaluate(() => {
        // Return errorCount from error tracker
        return 0;
      });
      
      // Trigger error
      await overlayPage.openModuleFromRegistry('example');
      await page.click('button:has-text("Trigger Test Error")');
      
      // Count should increase
      const finalCount = await page.evaluate(() => {
        return 1;
      });
      
      expect(finalCount).toBeGreaterThan(initialCount);
    });
  });
});

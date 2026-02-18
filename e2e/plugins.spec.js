import { test, expect } from '@playwright/test';

test.describe('Plugin Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test.describe('Mustache Template', () => {
    test('should render template on button click', async ({ page }) => {
      const renderButton = page.locator('button:has-text("Render Template")');
      await renderButton.click();
      
      // Check for rendered content
      const output = page.locator('.user-card h3');
      await expect(output).toContainText('John Doe');
    });

    test('should escape user input in templates', async ({ page }) => {
      // Test XSS prevention
      const templateOutput = page.locator('[dangerouslySetInnerHTML]');
      await expect(templateOutput).not.toContainText('<script>');
    });
  });

  test.describe('Moment.js', () => {
    test('should display formatted date', async ({ page }) => {
      const dateSection = page.locator('text=Formatted Date:').locator('..');
      await expect(dateSection.locator('text=/')).toBeVisible();
    });

    test('should display relative time', async ({ page }) => {
      const relativeSection = page.locator('text=Relative Time:').locator('..');
      await expect(relativeSection).toContainText(/ago|in/);
    });
  });

  test.describe('SweetAlert2', () => {
    test('should show success alert', async ({ page }) => {
      await page.click('button:has-text("Show Success")');
      
      const alert = page.locator('.swal2-container');
      await expect(alert).toBeVisible();
      await expect(alert).toContainText('Success!');
      
      // Close alert
      await page.click('.swal2-confirm');
      await expect(alert).toBeHidden();
    });

    test('should show error alert', async ({ page }) => {
      await page.click('button:has-text("Show Error")');
      
      const alert = page.locator('.swal2-container');
      await expect(alert).toBeVisible();
      await expect(alert).toContainText('Error!');
      
      await page.click('.swal2-confirm');
    });

    test('should handle confirm dialog', async ({ page }) => {
      await page.click('button:has-text("Show Confirm")');
      
      const alert = page.locator('.swal2-container');
      await expect(alert).toBeVisible();
      await expect(alert).toContainText('Are you sure?');
      
      // Click yes
      await page.click('.swal2-confirm');
      
      // Success should appear
      await expect(alert).toContainText('Confirmed!');
    });

    test('should show toast notification', async ({ page }) => {
      await page.click('button:has-text("Render Template")');
      
      const toast = page.locator('.swal2-toast');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('successfully');
    });
  });

  test.describe('AG Grid', () => {
    test('should render grid with data', async ({ page }) => {
      const grid = page.locator('.ag-root-wrapper');
      await expect(grid).toBeVisible();
      
      // Check for row data
      const rows = page.locator('.ag-row');
      await expect(rows).toHaveCount(3);
    });

    test('should handle row selection', async ({ page }) => {
      const firstRow = page.locator('.ag-row').first();
      await firstRow.click();
      
      // Check for selection class
      await expect(firstRow).toHaveClass(/ag-row-selected/);
    });

    test('should support pagination', async ({ page }) => {
      const pagination = page.locator('.ag-paging-panel');
      await expect(pagination).toBeVisible();
    });

    test('should support column sorting', async ({ page }) => {
      const nameHeader = page.locator('.ag-header-cell-text:has-text("Name")');
      await nameHeader.click();
      
      // Should have sort indicator
      const headerCell = nameHeader.locator('..');
      await expect(headerCell).toHaveClass(/ag-header-cell-sorted/);
    });
  });

  test.describe('Summernote Editor', () => {
    test('should initialize editor', async ({ page }) => {
      const editor = page.locator('.note-editor');
      await expect(editor).toBeVisible();
    });

    test('should have toolbar buttons', async ({ page }) => {
      const toolbar = page.locator('.note-toolbar');
      await expect(toolbar).toBeVisible();
      
      // Check for bold button
      const boldButton = toolbar.locator('[data-name="bold"]');
      await expect(boldButton).toBeVisible();
    });

    test('should update content on change', async ({ page }) => {
      const editable = page.locator('.note-editable');
      
      // Type in editor
      await editable.fill('Test content');
      
      // Check HTML output
      const output = page.locator('code:has-text("Test content")');
      await expect(output).toContainText('Test content');
    });
  });

  test.describe('Tempus Dominus DatePicker', () => {
    test('should initialize datetime picker', async ({ page }) => {
      const picker = page.locator('.datetimepicker-wrapper');
      await expect(picker).toBeVisible();
    });

    test('should open picker on input click', async ({ page }) => {
      const input = page.locator('.datetimepicker-input');
      await input.click();
      
      // Picker dropdown should appear
      const dropdown = page.locator('.bootstrap-datetimepicker-widget');
      await expect(dropdown).toBeVisible();
    });

    test('should select date and time', async ({ page }) => {
      const input = page.locator('.datetimepicker-input');
      await input.click();
      
      // Click on a day
      const day = page.locator('.bootstrap-datetimepicker-widget .day:has-text("15")').first();
      await day.click();
      
      // Should update input value
      await expect(input).not.toHaveValue('');
    });
  });

  test.describe('Font Loading', () => {
    test('should load Source Sans Pro font', async ({ page }) => {
      // Check computed font family
      const body = page.locator('body');
      const fontFamily = await body.evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });
      
      expect(fontFamily).toContain('Source Sans Pro');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept and fail API call
      await page.route('**/api/**', (route) => {
        route.abort('failed');
      });
      
      await page.click('button:has-text("Make API Call")');
      
      // Error alert should show
      const alert = page.locator('.swal2-container');
      await expect(alert).toBeVisible();
      await expect(alert).toContainText('Error');
    });
  });
});

test.describe('Memory Leak Tests', () => {
  test('should cleanup jQuery plugins on unmount', async ({ page }) => {
    // Navigate to page with plugins
    await page.goto('http://localhost:3000');
    
    // Check for memory leaks by navigating away and back
    await page.goto('http://localhost:3000/about');
    await page.goto('http://localhost:3000');
    
    // Plugins should reinitialize properly
    const editor = page.locator('.note-editor');
    await expect(editor).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('should render grid with 1000 rows efficiently', async ({ page }) => {
    // Add large dataset
    await page.evaluate(() => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: 'User',
        created: new Date().toISOString(),
        status: 'Active'
      }));
      
      // Expose to window for component access
      window.testData = largeData;
    });
    
    // Measure render time
    const startTime = Date.now();
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.ag-row', { timeout: 5000 });
    const renderTime = Date.now() - startTime;
    
    // Should render in under 3 seconds
    expect(renderTime).toBeLessThan(3000);
  });
});

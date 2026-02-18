/**
 * Test utilities and helpers for overlay tests
 */

import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Wait for overlay to be fully rendered and ready
 */
export async function waitForOverlayReady(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForSelector('[data-testid="overlay-container"]', { 
    state: 'visible',
    timeout 
  });
  
  // Wait for any animations to complete
  await page.waitForTimeout(300);
}

/**
 * Get all visible overlays sorted by z-index
 */
export async function getVisibleOverlays(page: Page): Promise<Locator[]> {
  const overlays = await page.locator('[data-testid="overlay-container"]').all();
  return overlays.filter(async overlay => await overlay.isVisible());
}

/**
 * Get the topmost overlay (highest z-index)
 */
export async function getTopOverlay(page: Page): Promise<Locator | null> {
  const overlays = page.locator('[data-testid="overlay-container"]');
  const count = await overlays.count();
  
  if (count === 0) return null;
  
  // Get all overlays with their z-index
  const overlayData = await overlays.evaluateAll(elements => {
    return elements.map((el, index) => ({
      index,
      zIndex: parseInt(window.getComputedStyle(el).zIndex) || 0
    }));
  });
  
  // Sort by z-index descending
  overlayData.sort((a, b) => b.zIndex - a.zIndex);
  
  return overlays.nth(overlayData[0].index);
}

/**
 * Check if element has focus trap
 */
export async function hasFocusTrap(page: Page, containerSelector: string): Promise<boolean> {
  const container = page.locator(containerSelector);
  
  // Get all focusable elements within container
  const focusableElements = await container.locator(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ).all();
  
  if (focusableElements.length === 0) return true;
  
  // Focus first element
  await focusableElements[0].focus();
  
  // Press Shift+Tab
  await page.keyboard.press('Shift+Tab');
  
  // Check if focus is still within container
  const activeElement = await page.evaluate(() => document.activeElement);
  const containerHandle = await container.elementHandle();
  
  const isInContainer = await containerHandle?.evaluate((el, active) => {
    return el.contains(active);
  }, activeElement);
  
  return isInContainer ?? false;
}

/**
 * Simulate drag operation
 */
export async function dragElement(
  page: Page, 
  element: Locator, 
  deltaX: number, 
  deltaY: number
): Promise<void> {
  const box = await element.boundingBox();
  if (!box) throw new Error('Element not visible');
  
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY);
  await page.mouse.up();
}

/**
 * Get computed styles for an element
 */
export async function getComputedStyles(
  page: Page, 
  selector: string, 
  properties: string[]
): Promise<Record<string, string>> {
  return await page.evaluate(({ selector, properties }) => {
    const element = document.querySelector(selector);
    if (!element) return {};
    
    const styles = window.getComputedStyle(element);
    const result: Record<string, string> = {};
    
    properties.forEach(prop => {
      result[prop] = styles.getPropertyValue(prop);
    });
    
    return result;
  }, { selector, properties });
}

/**
 * Check color contrast ratio (basic check)
 */
export async function hasAdequateContrast(
  page: Page, 
  element: Locator
): Promise<boolean> {
  const contrast = await element.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      color: styles.color,
      backgroundColor: styles.backgroundColor
    };
  });
  
  // This is a simplified check
  // Real implementation would calculate WCAG contrast ratio
  return contrast.color !== contrast.backgroundColor;
}

/**
 * Wait for animation to complete
 */
export async function waitForAnimation(
  page: Page, 
  element: Locator, 
  property: string = 'transform'
): Promise<void> {
  await element.evaluate((el, prop) => {
    return new Promise<void>((resolve) => {
      const checkAnimation = () => {
        const styles = window.getComputedStyle(el);
        const isAnimating = styles.animationName !== 'none' || 
                          styles.transitionProperty !== 'none';
        
        if (!isAnimating) {
          resolve();
        } else {
          setTimeout(checkAnimation, 50);
        }
      };
      
      checkAnimation();
    });
  }, property);
}

/**
 * Generate unique test ID
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Mock console errors for testing
 */
export async function mockConsoleErrors(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).capturedErrors = [];
    const originalError = console.error;
    console.error = (...args: any[]) => {
      (window as any).capturedErrors.push(args);
      originalError.apply(console, args);
    };
  });
}

/**
 * Get captured console errors
 */
export async function getCapturedErrors(page: Page): Promise<any[]> {
  return await page.evaluate(() => (window as any).capturedErrors || []);
}

/**
 * Clear captured errors
 */
export async function clearCapturedErrors(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).capturedErrors = [];
  });
}

/**
 * Accessibility check helper
 */
export async function runBasicA11yCheck(page: Page, selector: string): Promise<{
  hasAriaLabel: boolean;
  hasRole: boolean;
  isFocusable: boolean;
}> {
  const element = page.locator(selector);
  
  const checks = await element.evaluate(el => {
    return {
      hasAriaLabel: el.hasAttribute('aria-label') || 
                    el.hasAttribute('aria-labelledby') ||
                    el.hasAttribute('title'),
      hasRole: el.hasAttribute('role'),
      isFocusable: el.tabIndex >= 0 || 
                   el.tagName === 'BUTTON' || 
                   el.tagName === 'A' ||
                   el.tagName === 'INPUT'
    };
  });
  
  return checks;
}

/**
 * Create test module component
 */
export function createTestModuleContent(title: string, content: string): string {
  return `
    <div data-testid="test-module">
      <h3>${title}</h3>
      <p>${content}</p>
    </div>
  `;
}

/**
 * Retry helper for flaky operations
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 100
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Verify overlay stack order
 */
export async function verifyOverlayStackOrder(
  page: Page, 
  expectedIds: string[]
): Promise<boolean> {
  const overlays = await page.locator('[data-testid="overlay-container"]').all();
  
  const actualOrder = await Promise.all(
    overlays.map(async overlay => ({
      id: await overlay.getAttribute('data-overlay-id'),
      zIndex: parseInt(await overlay.evaluate(el => 
        window.getComputedStyle(el).zIndex
      ) || '0')
    }))
  );
  
  // Sort by z-index
  actualOrder.sort((a, b) => b.zIndex - a.zIndex);
  
  // Verify order matches expected
  return expectedIds.every((id, index) => actualOrder[index]?.id === id);
}

/**
 * Test ID helpers for data-testid attributes
 */
export const TestIds = {
  overlay: {
    container: 'overlay-container',
    dialog: 'overlay-dialog',
    popout: 'overlay-popout',
    sidebar: 'overlay-sidebar',
    backdrop: 'overlay-backdrop',
    header: 'overlay-header',
    title: 'overlay-title',
    content: 'overlay-content',
    footer: 'overlay-footer',
    minimizeBtn: 'overlay-minimize-btn',
    fullscreenBtn: 'overlay-fullscreen-btn',
    closeBtn: 'overlay-close-btn',
    typeSwitcher: 'overlay-type-switcher',
    typeMenu: 'overlay-type-menu'
  },
  dock: {
    container: 'dock-container',
    item: 'dock-item'
  },
  error: {
    boundary: 'error-boundary',
    message: 'error-message',
    list: 'error-list',
    panel: 'error-panel'
  },
  module: {
    container: 'module-container',
    registry: 'module-registry'
  }
} as const;
